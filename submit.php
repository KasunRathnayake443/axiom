<?php
/**
 * Axiom Global — Contact Form Handler
 * Uses PHPMailer + Laragon Mailpit (dev) or any SMTP (production)
 * Install PHPMailer: composer require phpmailer/phpmailer
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// ── Only accept POST ──────────────────────────────────────────────────────────
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

// ── Sanitise helpers ──────────────────────────────────────────────────────────
function clean(?string $value): string {
    return htmlspecialchars(strip_tags(trim($value ?? '')), ENT_QUOTES, 'UTF-8');
}

// ── Collect & sanitise form fields ────────────────────────────────────────────
$data = [
    // Part A
    'full_name'      => clean($_POST['full_name']      ?? ''),
    'company'        => clean($_POST['company']        ?? ''),
    'industry'       => clean($_POST['industry']       ?? ''),
    'email'          => filter_var(trim($_POST['email'] ?? ''), FILTER_SANITIZE_EMAIL),
    'phone'          => clean($_POST['phone']          ?? ''),
    'contact_method' => clean($_POST['contact_method'] ?? ''),
    // Part B
    'interest_area'  => clean($_POST['interest_area']  ?? ''),
    'challenge'      => clean($_POST['challenge']      ?? ''),
    // Part C
    'short_term'     => clean($_POST['short_term']     ?? ''),
    'long_term'      => clean($_POST['long_term']      ?? ''),
    'urgency'        => clean($_POST['urgency']        ?? ''),
    'referral'       => clean($_POST['referral']       ?? ''),
];

// ── Basic server-side validation ──────────────────────────────────────────────
$required = ['full_name', 'company', 'industry', 'email', 'phone', 'contact_method', 'interest_area', 'challenge', 'urgency'];
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

// ── Build HTML email ──────────────────────────────────────────────────────────
$submittedAt = date('D, d M Y \a\t H:i T');

function row(string $label, string $value): string {
    if ($value === '') return '';
    return "
    <tr>
        <td style='padding:10px 16px;background:#f4f7fb;border-bottom:1px solid #e0e7ef;
                   font-size:0.78rem;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;
                   color:#4a4f62;width:180px;vertical-align:top;'>
            {$label}
        </td>
        <td style='padding:10px 16px;border-bottom:1px solid #e0e7ef;
                   font-size:0.95rem;color:#1a1f2e;vertical-align:top;line-height:1.6;'>
            {$value}
        </td>
    </tr>";
}

$emailHTML = "
<!DOCTYPE html>
<html lang='en'>
<head>
<meta charset='UTF-8'>
<meta name='viewport' content='width=device-width,initial-scale=1'>
<title>New Consultation Request — Axiom Global</title>
</head>
<body style='margin:0;padding:0;background:#f4f7fb;font-family:Poppins,Helvetica,Arial,sans-serif;'>

<table width='100%' cellpadding='0' cellspacing='0' style='background:#f4f7fb;padding:40px 16px;'>
<tr><td align='center'>
<table width='620' cellpadding='0' cellspacing='0' style='max-width:620px;width:100%;background:#ffffff;
       border-radius:12px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.08);'>

    <!-- HEADER -->
    <tr>
        <td style='background:#0057b3;padding:32px 40px;'>
            <p style='margin:0;font-size:0.65rem;font-weight:600;letter-spacing:0.25em;
                      text-transform:uppercase;color:rgba(255,255,255,0.6);margin-bottom:8px;'>
                New Submission
            </p>
            <h1 style='margin:0;font-size:1.6rem;font-weight:700;color:#ffffff;letter-spacing:-0.02em;'>
                Consultation Request
            </h1>
            <p style='margin:10px 0 0;font-size:0.85rem;color:rgba(255,255,255,0.7);'>
                Received: {$submittedAt}
            </p>
        </td>
    </tr>

    <!-- PART A -->
    <tr>
        <td style='padding:28px 40px 8px;'>
            <p style='margin:0;font-size:0.65rem;font-weight:700;letter-spacing:0.22em;
                      text-transform:uppercase;color:#0057b3;border-bottom:2px solid #e0e7ef;
                      padding-bottom:10px;'>
                Part A — Identity
            </p>
        </td>
    </tr>
    <tr>
        <td style='padding:0 40px;'>
            <table width='100%' cellpadding='0' cellspacing='0' style='border:1px solid #e0e7ef;border-radius:8px;overflow:hidden;'>
                " . row('Full Name', $data['full_name'])
                 . row('Company', $data['company'])
                 . row('Industry', $data['industry'])
                 . row('Email', $data['email'])
                 . row('Phone', $data['phone'])
                 . row('Preferred Contact', $data['contact_method']) . "
            </table>
        </td>
    </tr>

    <!-- PART B -->
    <tr>
        <td style='padding:28px 40px 8px;'>
            <p style='margin:0;font-size:0.65rem;font-weight:700;letter-spacing:0.22em;
                      text-transform:uppercase;color:#0057b3;border-bottom:2px solid #e0e7ef;
                      padding-bottom:10px;'>
                Part B — The Challenge
            </p>
        </td>
    </tr>
    <tr>
        <td style='padding:0 40px;'>
            <table width='100%' cellpadding='0' cellspacing='0' style='border:1px solid #e0e7ef;border-radius:8px;overflow:hidden;'>
                " . row('Area of Interest', $data['interest_area'])
                 . row('Challenge', nl2br($data['challenge'])) . "
            </table>
        </td>
    </tr>

    <!-- PART C -->
    <tr>
        <td style='padding:28px 40px 8px;'>
            <p style='margin:0;font-size:0.65rem;font-weight:700;letter-spacing:0.22em;
                      text-transform:uppercase;color:#0057b3;border-bottom:2px solid #e0e7ef;
                      padding-bottom:10px;'>
                Part C — Roadmap &amp; Logistics
            </p>
        </td>
    </tr>
    <tr>
        <td style='padding:0 40px;'>
            <table width='100%' cellpadding='0' cellspacing='0' style='border:1px solid #e0e7ef;border-radius:8px;overflow:hidden;'>
                " . row('Short-Term Goal', nl2br($data['short_term']))
                 . row('Long-Term Vision', nl2br($data['long_term']))
                 . row('Urgency', $data['urgency'])
                 . row('Referral Source', $data['referral']) . "
            </table>
        </td>
    </tr>

    <!-- CTA -->
    <tr>
        <td style='padding:32px 40px;'>
            <table cellpadding='0' cellspacing='0'>
                <tr>
                    <td style='background:#0057b3;border-radius:40px;'>
                        <a href='mailto:{$data['email']}' style='display:inline-block;padding:14px 28px;
                           font-size:0.82rem;font-weight:600;letter-spacing:0.08em;color:#ffffff;
                           text-decoration:none;'>
                            Reply to {$data['full_name']} →
                        </a>
                    </td>
                </tr>
            </table>
        </td>
    </tr>

    <!-- FOOTER -->
    <tr>
        <td style='background:#f4f7fb;padding:20px 40px;border-top:1px solid #e0e7ef;'>
            <p style='margin:0;font-size:0.75rem;color:#9098a9;line-height:1.6;'>
                This email was generated automatically from the Axiom Global website contact form.<br>
                Do not reply to this message directly — use the button above to reply to the applicant.
            </p>
        </td>
    </tr>

</table>
</td></tr>
</table>

</body>
</html>";

// Plain text fallback
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

// ── Send via PHPMailer ────────────────────────────────────────────────────────
require __DIR__ . '/vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

$mail = new PHPMailer(true);

try {
    // SMTP config from .env
    $mail->isSMTP();
    $mail->Host       = env('MAIL_HOST', '127.0.0.1');
    $mail->Port       = (int) env('MAIL_PORT', '1025');
    $mail->SMTPAuth   = !empty(env('MAIL_USERNAME'));

    if ($mail->SMTPAuth) {
        $mail->Username   = env('MAIL_USERNAME');
        $mail->Password   = env('MAIL_PASSWORD');
    }

    $encryption = env('MAIL_ENCRYPTION', 'false');
    if ($encryption === 'tls') {
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    } elseif ($encryption === 'ssl') {
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    } else {
        $mail->SMTPSecure = false;
        $mail->SMTPAutoTLS = false;
    }

    // From / To
    $mail->setFrom(env('MAIL_FROM', 'noreply@axiomglobal.com'), env('MAIL_FROM_NAME', 'Axiom Global Website'));
    $mail->addAddress(env('MAIL_TO', 'owner@axiomglobal.com'));

    // Reply-To points to the person who submitted
    $mail->addReplyTo($data['email'], $data['full_name']);

    // Content
    $mail->isHTML(true);
    $mail->CharSet  = 'UTF-8';
    $mail->Subject  = "New Consultation Request — {$data['full_name']} ({$data['company']})";
    $mail->Body     = $emailHTML;
    $mail->AltBody  = $emailText;

    $mail->send();

    echo json_encode([
        'success' => true,
        'message' => 'Your request has been submitted. We will be in touch within 24 hours.'
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Could not send your message. Please try again or contact us directly.',
        'debug'   => env('APP_DEBUG', 'false') === 'true' ? $mail->ErrorInfo : null
    ]);
}