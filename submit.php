<?php
/**
 * Axiom Global — Contact Form Handler
 * PHPMailer + PDO MySQL storage
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ANTI-SPAM PROTECTION — THREE LAYERS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Layer 1 — reCAPTCHA v3 (Google)
 *   Verifies the token sent from the frontend against Google's API.
 *   Rejects any submission scoring below 0.5 (0 = bot, 1 = human).
 *   Required .env key: RECAPTCHA_SECRET=your_secret_key_here
 *
 * Layer 2 — Honeypot Field
 *   Rejects any submission where the hidden "website_url" field is filled.
 *   Bots fill all inputs; real users never see or touch this field.
 *
 * Layer 3 — Time-Based Check
 *   Rejects submissions completed in under MIN_FILL_SECONDS (default: 5s).
 *   Bots submit instantly; no human can read and fill this form that fast.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

// ── Load .env ─────────────────────────────────────────────────────────────────
function loadEnv(string $path): void {
    if (!file_exists($path)) return;
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) continue;
        [$key, $value] = array_map('trim', explode('=', $line, 2));
        if (!array_key_exists($key, $_ENV)) {
            putenv("$key=$value");
            $_ENV[$key] = $value;
        }
    }
}

loadEnv(__DIR__ . '/.env');

function env(string $key, string $default = ''): string {
    return $_ENV[$key] ?? getenv($key) ?: $default;
}

function clean(?string $value): string {
    return htmlspecialchars(strip_tags(trim($value ?? '')), ENT_QUOTES, 'UTF-8');
}

// ── Minimum seconds a human needs to fill this form ──────────────────────────
define('MIN_FILL_SECONDS', 5);

// ── ANTI-SPAM: Silent rejection helper ───────────────────────────────────────
// We return a fake "success" response to confuse bots rather than
// revealing that we detected them, which prevents them from adapting.
function silentReject(): never {
    echo json_encode([
        'success' => true,
        'message' => 'Your request has been submitted. We will be in touch within 24 hours.',
    ]);
    exit;
}

// ═══════════════════════════════════════════════════════════════════════════
// LAYER 2 — HONEYPOT CHECK
// If the hidden "website_url" field was filled, it's a bot.
// ═══════════════════════════════════════════════════════════════════════════
$honeypot = $_POST['website_url'] ?? '';
if (!empty(trim($honeypot))) {
    // Bot detected — silently pretend success
    silentReject();
}

// ═══════════════════════════════════════════════════════════════════════════
// LAYER 3 — TIME-BASED CHECK
// Reject if form was submitted in under MIN_FILL_SECONDS.
// ═══════════════════════════════════════════════════════════════════════════
$formLoadedAt = (int) ($_POST['form_loaded_at'] ?? 0);
if ($formLoadedAt > 0) {
    $elapsedSeconds = (int) floor((time() * 1000 - $formLoadedAt) / 1000);
    if ($elapsedSeconds < MIN_FILL_SECONDS) {
        // Too fast — bot detected
        silentReject();
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// LAYER 1 — reCAPTCHA v3 VERIFICATION
// Calls Google's siteverify API to validate the token from the frontend.
// ═══════════════════════════════════════════════════════════════════════════
$recaptchaSecret = env('RECAPTCHA_SECRET');
$recaptchaToken  = clean($_POST['recaptcha_token'] ?? '');

if (!empty($recaptchaSecret) && !empty($recaptchaToken)) {

    $verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';
    $verifyData = http_build_query([
        'secret'   => $recaptchaSecret,
        'response' => $recaptchaToken,
        'remoteip' => $_SERVER['REMOTE_ADDR'] ?? '',
    ]);

    $ctx = stream_context_create([
        'http' => [
            'method'  => 'POST',
            'header'  => 'Content-Type: application/x-www-form-urlencoded',
            'content' => $verifyData,
            'timeout' => 5,
        ],
    ]);

    $verifyResult = @file_get_contents($verifyUrl, false, $ctx);

    if ($verifyResult === false) {
        // Google API unreachable — fail open (let through) to avoid
        // blocking real users during a Google outage. Remove this
        // branch and replace with silentReject() if you prefer to fail closed.
        error_log('[Axiom] reCAPTCHA API unreachable — skipping check.');
    } else {
        $recaptchaResponse = json_decode($verifyResult, true);

        $passed = ($recaptchaResponse['success'] ?? false) === true
               && ($recaptchaResponse['action']  ?? '')    === 'contact_form'
               && ($recaptchaResponse['score']   ?? 0)     >= 0.5;

        if (!$passed) {
            // Failed reCAPTCHA — silently reject
            error_log(sprintf(
                '[Axiom] reCAPTCHA failed — score: %s, action: %s, errors: %s',
                $recaptchaResponse['score']  ?? 'n/a',
                $recaptchaResponse['action'] ?? 'n/a',
                implode(', ', $recaptchaResponse['error-codes'] ?? [])
            ));
            silentReject();
        }
    }

} elseif (!empty($recaptchaSecret) && empty($recaptchaToken)) {
    // Secret is configured but no token was submitted — definitely a bot
    // (real browsers always send a token when reCAPTCHA is loaded)
    silentReject();
}
// If RECAPTCHA_SECRET is not set in .env, skip reCAPTCHA check entirely
// (useful during local development — add the key for production).

// ── Collect & sanitise ────────────────────────────────────────────────────────
$data = [
    'full_name'      => clean($_POST['full_name']      ?? ''),
    'company'        => clean($_POST['company']        ?? ''),
    'industry'       => clean($_POST['industry']       ?? ''),
    'email'          => filter_var(trim($_POST['email'] ?? ''), FILTER_SANITIZE_EMAIL),
    'phone'          => clean($_POST['phone']          ?? ''),
    'contact_method' => clean($_POST['contact_method'] ?? ''),
    'interest_area'  => clean($_POST['interest_area']  ?? ''),
    'challenge'      => clean($_POST['challenge']      ?? ''),
    'short_term'     => clean($_POST['short_term']     ?? ''),
    'long_term'      => clean($_POST['long_term']      ?? ''),
    'urgency'        => clean($_POST['urgency']        ?? ''),
    'referral'       => clean($_POST['referral']       ?? ''),
];

// ── Validation ────────────────────────────────────────────────────────────────
$required = ['full_name','company','industry','email','phone','contact_method','interest_area','challenge','urgency'];
foreach ($required as $field) {
    if (empty($data[$field])) {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => 'Please fill all required fields.']);
        exit;
    }
}

if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Please provide a valid email address.']);
    exit;
}

// ── Build owner notification email ────────────────────────────────────────────
$submittedAt = date('D, d M Y \a\t H:i T');

function row(string $label, string $value): string {
    if ($value === '') return '';
    return "
    <tr>
        <td style='padding:10px 16px;background:#f4f7fb;border-bottom:1px solid #e0e7ef;
                   font-size:0.78rem;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;
                   color:#4a4f62;width:180px;vertical-align:top;'>{$label}</td>
        <td style='padding:10px 16px;border-bottom:1px solid #e0e7ef;
                   font-size:0.95rem;color:#1a1f2e;vertical-align:top;line-height:1.6;'>{$value}</td>
    </tr>";
}

$emailHTML = "<!DOCTYPE html>
<html lang='en'>
<head><meta charset='UTF-8'><title>New Consultation Request — Axiom Global</title></head>
<body style='margin:0;padding:0;background:#f4f7fb;font-family:Poppins,Helvetica,Arial,sans-serif;'>
<table width='100%' cellpadding='0' cellspacing='0' style='background:#f4f7fb;padding:40px 16px;'>
<tr><td align='center'>
<table width='620' cellpadding='0' cellspacing='0' style='max-width:620px;width:100%;background:#ffffff;
       border-radius:12px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.08);'>
    <tr>
        <td style='background:#0057b3;padding:32px 40px;'>
            <p style='margin:0 0 8px;font-size:0.65rem;font-weight:600;letter-spacing:0.25em;
                      text-transform:uppercase;color:rgba(255,255,255,0.6);'>New Submission</p>
            <h1 style='margin:0;font-size:1.6rem;font-weight:700;color:#ffffff;'>Consultation Request</h1>
            <p style='margin:10px 0 0;font-size:0.85rem;color:rgba(255,255,255,0.7);'>Received: {$submittedAt}</p>
        </td>
    </tr>
    <tr><td style='padding:28px 40px 8px;'>
        <p style='margin:0;font-size:0.65rem;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;
                  color:#0057b3;border-bottom:2px solid #e0e7ef;padding-bottom:10px;'>Part A — Identity</p>
    </td></tr>
    <tr><td style='padding:0 40px;'>
        <table width='100%' cellpadding='0' cellspacing='0' style='border:1px solid #e0e7ef;border-radius:8px;overflow:hidden;'>
            " . row('Full Name', $data['full_name'])
             . row('Company',   $data['company'])
             . row('Industry',  $data['industry'])
             . row('Email',     $data['email'])
             . row('Phone',     $data['phone'])
             . row('Preferred Contact', $data['contact_method']) . "
        </table>
    </td></tr>
    <tr><td style='padding:28px 40px 8px;'>
        <p style='margin:0;font-size:0.65rem;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;
                  color:#0057b3;border-bottom:2px solid #e0e7ef;padding-bottom:10px;'>Part B — The Challenge</p>
    </td></tr>
    <tr><td style='padding:0 40px;'>
        <table width='100%' cellpadding='0' cellspacing='0' style='border:1px solid #e0e7ef;border-radius:8px;overflow:hidden;'>
            " . row('Area of Interest', $data['interest_area'])
             . row('Challenge', nl2br($data['challenge'])) . "
        </table>
    </td></tr>
    <tr><td style='padding:28px 40px 8px;'>
        <p style='margin:0;font-size:0.65rem;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;
                  color:#0057b3;border-bottom:2px solid #e0e7ef;padding-bottom:10px;'>Part C — Roadmap &amp; Logistics</p>
    </td></tr>
    <tr><td style='padding:0 40px;'>
        <table width='100%' cellpadding='0' cellspacing='0' style='border:1px solid #e0e7ef;border-radius:8px;overflow:hidden;'>
            " . row('Short-Term Goal',  nl2br($data['short_term']))
             . row('Long-Term Vision',  nl2br($data['long_term']))
             . row('Urgency',           $data['urgency'])
             . row('Referral Source',   $data['referral']) . "
        </table>
    </td></tr>
    <tr><td style='padding:32px 40px;'>
        <table cellpadding='0' cellspacing='0'><tr>
            <td style='background:#0057b3;border-radius:40px;'>
                <a href='mailto:{$data['email']}' style='display:inline-block;padding:14px 28px;
                   font-size:0.82rem;font-weight:600;letter-spacing:0.08em;color:#ffffff;text-decoration:none;'>
                    Reply to {$data['full_name']} →
                </a>
            </td>
        </tr></table>
    </td></tr>
    <tr>
        <td style='background:#f4f7fb;padding:20px 40px;border-top:1px solid #e0e7ef;'>
            <p style='margin:0;font-size:0.75rem;color:#9098a9;line-height:1.6;'>
                This email was generated automatically from the Axiom Global website contact form.<br>
                Do not reply to this message — use the button above to reply to the applicant.
            </p>
        </td>
    </tr>
</table>
</td></tr>
</table>
</body></html>";

$emailText = "NEW CONSULTATION REQUEST — AXIOM GLOBAL\n"
    . "Received: {$submittedAt}\n\n"
    . "--- PART A: IDENTITY ---\n"
    . "Name:             {$data['full_name']}\n"
    . "Company:          {$data['company']}\n"
    . "Industry:         {$data['industry']}\n"
    . "Email:            {$data['email']}\n"
    . "Phone:            {$data['phone']}\n"
    . "Contact Method:   {$data['contact_method']}\n\n"
    . "--- PART B: THE CHALLENGE ---\n"
    . "Area of Interest: {$data['interest_area']}\n"
    . "Challenge:\n{$data['challenge']}\n\n"
    . "--- PART C: ROADMAP ---\n"
    . "Short-Term Goal:\n{$data['short_term']}\n\n"
    . "Long-Term Vision:\n{$data['long_term']}\n\n"
    . "Urgency:          {$data['urgency']}\n"
    . "Referral:         {$data['referral']}\n";

// ── Build confirmation email ───────────────────────────────────────────────────
$confirmHTML = "<!DOCTYPE html>
<html lang='en'>
<head><meta charset='UTF-8'><title>We've received your request — Axiom Global</title></head>
<body style='margin:0;padding:0;background:#f4f7fb;font-family:Poppins,Helvetica,Arial,sans-serif;'>
<table width='100%' cellpadding='0' cellspacing='0' style='background:#f4f7fb;padding:40px 16px;'>
<tr><td align='center'>
<table width='620' cellpadding='0' cellspacing='0' style='max-width:620px;width:100%;background:#ffffff;
       border-radius:12px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.08);'>
    <tr>
        <td style='background:#0057b3;padding:32px 40px;'>
            <h1 style='margin:0;font-size:1.5rem;font-weight:700;color:#ffffff;'>
                Thank you, {$data['full_name']}!
            </h1>
            <p style='margin:10px 0 0;font-size:0.9rem;color:rgba(255,255,255,0.75);'>
                We've received your consultation request.
            </p>
        </td>
    </tr>
    <tr>
        <td style='padding:32px 40px;font-size:0.95rem;color:#1a1f2e;line-height:1.8;'>
            <p>Hi <strong>{$data['full_name']}</strong>,</p>
            <p>Thank you for reaching out to <strong>Axiom Global</strong>. We have successfully received
               your consultation request and a member of our team will be in touch within
               <strong>24 hours</strong> via your preferred contact method
               (<strong>{$data['contact_method']}</strong>).</p>
            <p>Here's a summary of what you submitted:</p>
            <table width='100%' cellpadding='0' cellspacing='0'
                   style='border:1px solid #e0e7ef;border-radius:8px;overflow:hidden;margin:16px 0;'>
                <tr>
                    <td style='padding:10px 16px;background:#f4f7fb;border-bottom:1px solid #e0e7ef;
                               font-size:0.78rem;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;
                               color:#4a4f62;width:160px;vertical-align:top;'>Company</td>
                    <td style='padding:10px 16px;border-bottom:1px solid #e0e7ef;font-size:0.9rem;color:#1a1f2e;'>
                        {$data['company']}</td>
                </tr>
                <tr>
                    <td style='padding:10px 16px;background:#f4f7fb;border-bottom:1px solid #e0e7ef;
                               font-size:0.78rem;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;
                               color:#4a4f62;vertical-align:top;'>Area of Interest</td>
                    <td style='padding:10px 16px;border-bottom:1px solid #e0e7ef;font-size:0.9rem;color:#1a1f2e;'>
                        {$data['interest_area']}</td>
                </tr>
                <tr>
                    <td style='padding:10px 16px;background:#f4f7fb;font-size:0.78rem;font-weight:600;
                               letter-spacing:0.08em;text-transform:uppercase;color:#4a4f62;vertical-align:top;'>
                        Urgency</td>
                    <td style='padding:10px 16px;font-size:0.9rem;color:#1a1f2e;'>{$data['urgency']}</td>
                </tr>
            </table>
            <p>If you have any urgent questions, feel free to reply to this email or reach out directly.</p>
            <p style='margin-top:32px;'>Warm regards,<br><strong>The Axiom Global Team</strong></p>
        </td>
    </tr>
    <tr>
        <td style='background:#f4f7fb;padding:20px 40px;border-top:1px solid #e0e7ef;'>
            <p style='margin:0;font-size:0.75rem;color:#9098a9;line-height:1.6;'>
                This is an automated confirmation from Axiom Global.<br>
                A team member will contact you separately — no need to reply here.
            </p>
        </td>
    </tr>
</table>
</td></tr>
</table>
</body></html>";

$confirmText = "Hi {$data['full_name']},\n\n"
    . "Thank you for contacting Axiom Global. We have received your consultation request\n"
    . "and will be in touch within 24 hours via {$data['contact_method']}.\n\n"
    . "Summary:\n"
    . "Company:          {$data['company']}\n"
    . "Area of Interest: {$data['interest_area']}\n"
    . "Urgency:          {$data['urgency']}\n\n"
    . "Warm regards,\nThe Axiom Global Team";

// ── PHPMailer helper ──────────────────────────────────────────────────────────
require __DIR__ . '/vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

function buildMailer(): PHPMailer {
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host      = env('MAIL_HOST', '127.0.0.1');
    $mail->Port      = (int) env('MAIL_PORT', '465');
    $mail->SMTPAuth  = true;
    $mail->Username  = env('MAIL_USERNAME');
    $mail->Password  = env('MAIL_PASSWORD');
    $mail->CharSet   = 'UTF-8';

    $enc = env('MAIL_ENCRYPTION', 'ssl');
    if ($enc === 'tls') {
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    } elseif ($enc === 'ssl') {
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    } else {
        $mail->SMTPSecure  = false;
        $mail->SMTPAutoTLS = false;
    }

    $mail->setFrom(env('MAIL_FROM', 'noreply@axg.lk'), env('MAIL_FROM_NAME', 'Axiom Global'));
    return $mail;
}

// ── Database helper ───────────────────────────────────────────────────────────
function getDB(): PDO {
    $dsn = sprintf(
        'mysql:host=%s;dbname=%s;charset=utf8mb4',
        env('DB_HOST', 'localhost'),
        env('DB_NAME')
    );
    return new PDO($dsn, env('DB_USER'), env('DB_PASS'), [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
}

// ── Save to database ──────────────────────────────────────────────────────────
function saveToDatabase(array $data): void {
    $db  = getDB();
    $sql = "INSERT INTO consultation_requests
                (full_name, company, industry, email, phone, contact_method,
                 interest_area, challenge, short_term, long_term, urgency, referral)
            VALUES
                (:full_name, :company, :industry, :email, :phone, :contact_method,
                 :interest_area, :challenge, :short_term, :long_term, :urgency, :referral)";

    $stmt = $db->prepare($sql);
    $stmt->execute([
        ':full_name'      => $data['full_name'],
        ':company'        => $data['company'],
        ':industry'       => $data['industry'],
        ':email'          => $data['email'],
        ':phone'          => $data['phone'],
        ':contact_method' => $data['contact_method'],
        ':interest_area'  => $data['interest_area'],
        ':challenge'      => $data['challenge'],
        ':short_term'     => $data['short_term']  ?: null,
        ':long_term'      => $data['long_term']   ?: null,
        ':urgency'        => $data['urgency'],
        ':referral'       => $data['referral']    ?: null,
    ]);
}

// ── Send emails + save to DB ──────────────────────────────────────────────────
try {
    // 1. Save to database first
    saveToDatabase($data);

    // 2. Owner notification email
    $owner = buildMailer();
    $owner->addAddress(env('MAIL_TO', 'owner@axg.lk'));
    $owner->addReplyTo($data['email'], $data['full_name']);
    $owner->isHTML(true);
    $owner->Subject = "New Consultation Request — {$data['full_name']} ({$data['company']})";
    $owner->Body    = $emailHTML;
    $owner->AltBody = $emailText;
    $owner->send();

    // 3. User confirmation email
    $confirm = buildMailer();
    $confirm->addAddress($data['email'], $data['full_name']);
    $confirm->isHTML(true);
    $confirm->Subject = "We've received your request — Axiom Global";
    $confirm->Body    = $confirmHTML;
    $confirm->AltBody = $confirmText;
    $confirm->send();

    echo json_encode([
        'success' => true,
        'message' => 'Your request has been submitted. We will be in touch within 24 hours.'
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Could not send your message. Please try again or contact us directly.',
        'debug'   => env('APP_DEBUG', 'false') === 'true' ? $e->getMessage() : null
    ]);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'A server error occurred. Please try again.',
        'debug'   => env('APP_DEBUG', 'false') === 'true' ? $e->getMessage() : null
    ]);
}