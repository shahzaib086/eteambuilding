'use strict'

const utils = require('../helpers/utility.js')
const config = require('../config/app-config.js');
const brevo = require('@getbrevo/brevo');
require("dotenv").config();

let defaultClient = brevo.ApiClient.instance;

let apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_SMTP_API_KEY;

let apiInstance = new brevo.TransactionalEmailsApi();
let sendSmtpEmail = new brevo.SendSmtpEmail();

const template_welcome = `<html>
    <head>
        <title></title>
        <style type="text/css">
            @media screen{@font-face{font-family:Lato;font-style:normal;font-weight:400;src:local("Lato Regular"),local("Lato-Regular"),url(https://fonts.gstatic.com/s/lato/v11/qIIYRU-oROkIk8vfvxw6QvesZW2xOQ-xsNqO47m55DA.woff) format("woff")}@font-face{font-family:Lato;font-style:normal;font-weight:700;src:local("Lato Bold"),local("Lato-Bold"),url(https://fonts.gstatic.com/s/lato/v11/qdgUG4U09HnJwhYI-uK18wLUuEpTyoUstqEm5AMlJo4.woff) format("woff")}@font-face{font-family:Lato;font-style:italic;font-weight:400;src:local("Lato Italic"),local("Lato-Italic"),url(https://fonts.gstatic.com/s/lato/v11/RYyZNoeFgb0l7W3Vu1aSWOvvDin1pK8aKteLpeZ5c0A.woff) format("woff")}@font-face{font-family:Lato;font-style:italic;font-weight:700;src:local("Lato Bold Italic"),local("Lato-BoldItalic"),url(https://fonts.gstatic.com/s/lato/v11/HkF_qI1x_noxlxhrhMQYELO3LdcAZYWl9Si6vvxL-qU.woff) format("woff")}}a,body,table,td{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}table,td{mso-table-lspace:0;mso-table-rspace:0}img{-ms-interpolation-mode:bicubic}img{border:0;height:auto;line-height:100%;outline:0;text-decoration:none}table{border-collapse:collapse!important}body{height:100%!important;margin:0!important;padding:0!important;width:100%!important}a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important;font-size:inherit!important;font-family:inherit!important;font-weight:inherit!important;line-height:inherit!important}@media screen and (max-width:600px){h1{font-size:32px!important;line-height:32px!important}}div[style*="margin: 16px 0;"]{margin:0!important}
        </style>
    </head>
    <body style="background-color:#f4f4f4;margin:0!important;padding:0!important"><table border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td align="center" style="padding:0 10px 0 10px;"><table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;border-top-right-radius:6px;border-top-left-radius:6px"><tr><td xbgcolor="#ffffff" xalign="center" valign="top" style="padding:40px 20px 20px 20px;border-radius:4px 4px 0 0;color:#111;font-family:Lato,Helvetica,Arial,sans-serif;font-size:48px;font-weight:400;letter-spacing:4px;line-height:48px;display:flex;justify-content:center;align-items:center"><img src="{{logo_url_one}}" alt="PEL"></td></tr></table></td></tr><tr><td bgcolor="#ffffff" align="center" style="padding:0 10px 0 10px"><table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:90%"><tr><td bgcolor="#ffffff" align="left" style="padding:20px 30px 20px 30px;color:#666;font-family:Helvetica,Arial,sans-serif;font-size:18px;font-weight:400;line-height:25px"><p style="margin:0;font-size:14px">Hey User! 👋</p><p style="margin:0;margin-top:10px;font-size:14px">A warm and bubbly welcome to PEL! 🎉 We're thrilled to have you join our community of like-minded individuals looking for meaningful connections, fun experiences, and perhaps even the love of their life.<br><br>Here are a few tips to get started:<br><strong>Complete Your Profile:</strong><br>Show off those dazzling smiles! 😁 Add a cool profile picture, whip up a catchy bio, and let others in on your passions. A killer profile is the secret sauce to making your profile shine!<br><br><strong>Explore Matches:</strong><br>Get ready for the match magic! ✨ Our fancy algorithm curates potential matches based on your preferences. Swipe right if you're vibing, left if it's a no-go.<br><br><strong>Have Fun!</strong><br>Dating should be a blast! 🎉 Whether you're here for LOLs, new buddies, or something a bit more, soak in the experience and enjoy connecting with awesome peeps.<br><br>If you ever have questions or need assistance, our support team is here for you. Feel free to reach out to [support email/phone].<br><br>Once again, welcome to PEL. We hope your journey is filled with exciting connections and meaningful moments. 🚀<br><br>Happy dating! 💖<br><br>Best regards,<br>PEL Dating Team</p></td></tr><tr><td bgcolor="#ffffff" align="left" style="padding:20px;font-family:Helvetica,Arial,sans-serif;color:#666;font-size:14px"><hr style="margin-top:20px"><p style="margin:0;text-align:center;padding:10px;font-size:12px;padding-top:0">info@peldating.com</p><p style="margin:0;text-align:center;padding:10px;font-size:12px;padding-top:0">© 2023 All Rights Reserved</p><p style="margin:0;text-align:center;padding:10px;font-size:12px;padding-top:0"><a href="{{policy_url}}">Privacy Policy</a>&nbsp;&nbsp;<a href="{{terms_url}}">Terms & Conditions</a></p></td></tr></table></td></tr></table></body>
</html>`;

const template_otp = `<html>
    <head>
        <title></title>
        <style type="text/css">
            @media screen{@font-face{font-family:Lato;font-style:normal;font-weight:400;src:local("Lato Regular"),local("Lato-Regular"),url(https://fonts.gstatic.com/s/lato/v11/qIIYRU-oROkIk8vfvxw6QvesZW2xOQ-xsNqO47m55DA.woff) format("woff")}@font-face{font-family:Lato;font-style:normal;font-weight:700;src:local("Lato Bold"),local("Lato-Bold"),url(https://fonts.gstatic.com/s/lato/v11/qdgUG4U09HnJwhYI-uK18wLUuEpTyoUstqEm5AMlJo4.woff) format("woff")}@font-face{font-family:Lato;font-style:italic;font-weight:400;src:local("Lato Italic"),local("Lato-Italic"),url(https://fonts.gstatic.com/s/lato/v11/RYyZNoeFgb0l7W3Vu1aSWOvvDin1pK8aKteLpeZ5c0A.woff) format("woff")}@font-face{font-family:Lato;font-style:italic;font-weight:700;src:local("Lato Bold Italic"),local("Lato-BoldItalic"),url(https://fonts.gstatic.com/s/lato/v11/HkF_qI1x_noxlxhrhMQYELO3LdcAZYWl9Si6vvxL-qU.woff) format("woff")}}a,body,table,td{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}table,td{mso-table-lspace:0;mso-table-rspace:0}img{-ms-interpolation-mode:bicubic}img{border:0;height:auto;line-height:100%;outline:0;text-decoration:none}table{border-collapse:collapse!important}body{height:100%!important;margin:0!important;padding:0!important;width:100%!important}a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important;font-size:inherit!important;font-family:inherit!important;font-weight:inherit!important;line-height:inherit!important}@media screen and (max-width:600px){h1{font-size:32px!important;line-height:32px!important}}div[style*="margin: 16px 0;"]{margin:0!important}
        </style>
    </head>
    <body style="background-color:#f4f4f4;margin:0!important;padding:0!important"><table border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td align="center" style="padding:0 10px 0 10px;"><table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;border-top-right-radius:6px;border-top-left-radius:6px"><tr><td xbgcolor="#ffffff" xalign="center" valign="top" style="padding:40px 20px 20px 20px;border-radius:4px 4px 0 0;color:#111;font-family:Lato,Helvetica,Arial,sans-serif;font-size:48px;font-weight:400;letter-spacing:4px;line-height:48px;display:flex;justify-content:center;align-items:center"><img src="{{logo_url_one}}" alt="PEL"></td></tr></table></td></tr><tr><td bgcolor="#ffffff" align="center" style="padding:0 10px 0 10px"><table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:90%"><tr><td bgcolor="#ffffff" align="left" style="padding:20px 30px 20px 30px;color:#666;font-family:Helvetica,Arial,sans-serif;font-size:18px;font-weight:400;line-height:25px;text-align:left"><p style="margin:0;font-size:14px">Dear User,</p><p style="margin:0;margin-top:10px;font-size:14px">Welcome to PEL! 🎉 We’re excited to have you on board. To complete your account setup, please use the verification code below:<br><strong>{{code}}</strong><br><br>Please enter this code in the verification in the app to activate your account. If you didn’t sign up for Pel, you can ignore this email.<br><br>Thank you for choosing Pel!<br>For any assistance or questions, our support team is here to help. Contact us at info@peldating.com<br><br>Best regards,<br>PEL Dating Team</p></td></tr><tr><td bgcolor="#ffffff" align="left" style="padding:20px;font-family:Helvetica,Arial,sans-serif;color:#666;font-size:14px"><hr style="margin-top:20px"><p style="margin:0;text-align:center;padding:10px;font-size:12px;padding-top:0">info@peldating.com</p><p style="margin:0;text-align:center;padding:10px;font-size:12px;padding-top:0">© 2023 All Rights Reserved</p><p style="margin:0;text-align:center;padding:10px;font-size:12px;padding-top:0"><a href="{{policy_url}}">Privacy Policy</a>&nbsp;&nbsp;<a href="{{terms_url}}">Terms & Conditions</a></p></td></tr></table></td></tr></table></body>
</html>`;

const template_forgot_password = `<html>
    <head>
        <title></title>
        <style type="text/css">
            @media screen{@font-face{font-family:Lato;font-style:normal;font-weight:400;src:local("Lato Regular"),local("Lato-Regular"),url(https://fonts.gstatic.com/s/lato/v11/qIIYRU-oROkIk8vfvxw6QvesZW2xOQ-xsNqO47m55DA.woff) format("woff")}@font-face{font-family:Lato;font-style:normal;font-weight:700;src:local("Lato Bold"),local("Lato-Bold"),url(https://fonts.gstatic.com/s/lato/v11/qdgUG4U09HnJwhYI-uK18wLUuEpTyoUstqEm5AMlJo4.woff) format("woff")}@font-face{font-family:Lato;font-style:italic;font-weight:400;src:local("Lato Italic"),local("Lato-Italic"),url(https://fonts.gstatic.com/s/lato/v11/RYyZNoeFgb0l7W3Vu1aSWOvvDin1pK8aKteLpeZ5c0A.woff) format("woff")}@font-face{font-family:Lato;font-style:italic;font-weight:700;src:local("Lato Bold Italic"),local("Lato-BoldItalic"),url(https://fonts.gstatic.com/s/lato/v11/HkF_qI1x_noxlxhrhMQYELO3LdcAZYWl9Si6vvxL-qU.woff) format("woff")}}a,body,table,td{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}table,td{mso-table-lspace:0;mso-table-rspace:0}img{-ms-interpolation-mode:bicubic}img{border:0;height:auto;line-height:100%;outline:0;text-decoration:none}table{border-collapse:collapse!important}body{height:100%!important;margin:0!important;padding:0!important;width:100%!important}a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important;font-size:inherit!important;font-family:inherit!important;font-weight:inherit!important;line-height:inherit!important}@media screen and (max-width:600px){h1{font-size:32px!important;line-height:32px!important}}div[style*="margin: 16px 0;"]{margin:0!important}
        </style>
    </head>
    <body style="background-color:#f4f4f4;margin:0!important;padding:0!important"><table border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td align="center" style="padding:0 10px 0 10px;"><table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;border-top-right-radius:6px;border-top-left-radius:6px"><tr><td xbgcolor="#ffffff" xalign="center" valign="top" style="padding:40px 20px 20px 20px;border-radius:4px 4px 0 0;color:#111;font-family:Lato,Helvetica,Arial,sans-serif;font-size:48px;font-weight:400;letter-spacing:4px;line-height:48px;display:flex;justify-content:center;align-items:center"><img src="{{logo_url_one}}" alt="PEL"></td></tr></table></td></tr><tr><td bgcolor="#ffffff" align="center" style="padding:0 10px 0 10px"><table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:90%"><tr><td bgcolor="#ffffff" align="left" style="padding:20px 30px 20px 30px;color:#666;font-family:Helvetica,Arial,sans-serif;font-size:18px;font-weight:400;line-height:25px;text-align:left"><p style="margin:0;font-size:14px">Dear User,</p><p style="margin:0;margin-top:10px;font-size:14px">We’ve received your request to reset your password.<br>Please use the code below.<br><strong>{{code}}</strong><br><br>If you didn’t request this, you can ignore this email.<br><br>For any assistance or questions, our support team is here to help. Contact us at info@peldating.com<br><br>Best regards,<br>PEL Dating Team</p></td></tr><tr><td bgcolor="#ffffff" align="left" style="padding:20px;font-family:Helvetica,Arial,sans-serif;color:#666;font-size:14px"><hr style="margin-top:20px"><p style="margin:0;text-align:center;padding:10px;font-size:12px;padding-top:0">info@peldating.com</p><p style="margin:0;text-align:center;padding:10px;font-size:12px;padding-top:0">© 2023 All Rights Reserved</p><p style="margin:0;text-align:center;padding:10px;font-size:12px;padding-top:0"><a href="{{policy_url}}">Privacy Policy</a>&nbsp;&nbsp;<a href="{{terms_url}}">Terms & Conditions</a></p></td></tr></table></td></tr></table></body>
</html>`;

const old_template_forgot_password = `<html>
    <head>
        <title></title>
        <style type="text/css">
            @media screen{@font-face{font-family:Lato;font-style:normal;font-weight:400;src:local("Lato Regular"),local("Lato-Regular"),url(https://fonts.gstatic.com/s/lato/v11/qIIYRU-oROkIk8vfvxw6QvesZW2xOQ-xsNqO47m55DA.woff) format("woff")}@font-face{font-family:Lato;font-style:normal;font-weight:700;src:local("Lato Bold"),local("Lato-Bold"),url(https://fonts.gstatic.com/s/lato/v11/qdgUG4U09HnJwhYI-uK18wLUuEpTyoUstqEm5AMlJo4.woff) format("woff")}@font-face{font-family:Lato;font-style:italic;font-weight:400;src:local("Lato Italic"),local("Lato-Italic"),url(https://fonts.gstatic.com/s/lato/v11/RYyZNoeFgb0l7W3Vu1aSWOvvDin1pK8aKteLpeZ5c0A.woff) format("woff")}@font-face{font-family:Lato;font-style:italic;font-weight:700;src:local("Lato Bold Italic"),local("Lato-BoldItalic"),url(https://fonts.gstatic.com/s/lato/v11/HkF_qI1x_noxlxhrhMQYELO3LdcAZYWl9Si6vvxL-qU.woff) format("woff")}}a,body,table,td{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}table,td{mso-table-lspace:0;mso-table-rspace:0}img{-ms-interpolation-mode:bicubic}img{border:0;height:auto;line-height:100%;outline:0;text-decoration:none}table{border-collapse:collapse!important}body{height:100%!important;margin:0!important;padding:0!important;width:100%!important}a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important;font-size:inherit!important;font-family:inherit!important;font-weight:inherit!important;line-height:inherit!important}@media screen and (max-width:600px){h1{font-size:32px!important;line-height:32px!important}}div[style*="margin: 16px 0;"]{margin:0!important}
        </style>
    </head>
    <body style="background-color:#f4f4f4;margin:0!important;padding:0!important"><table border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td align="center" style="padding:0 10px 0 10px;"><table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;border-top-right-radius:6px;border-top-left-radius:6px"><tr><td xbgcolor="#ffffff" xalign="center" valign="top" style="padding:40px 20px 20px 20px;border-radius:4px 4px 0 0;color:#111;font-family:Lato,Helvetica,Arial,sans-serif;font-size:48px;font-weight:400;letter-spacing:4px;line-height:48px;display:flex;justify-content:center;align-items:center"><img src="{{logo_url_one}}" alt="PEL"></td></tr></table></td></tr><tr><td bgcolor="#ffffff" align="center" style="padding:0 10px 0 10px"><table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:90%"><tr><td bgcolor="#ffffff" align="left" style="padding:20px 30px 20px 30px;color:#666;font-family:Helvetica,Arial,sans-serif;font-size:18px;font-weight:400;line-height:25px;text-align:center"><p style="margin:0;font-size:14px">Dear User,</p><p style="margin:0;margin-top:10px;font-size:14px">Please enter this otp code to reset your password.</p></td></tr><tr><td bgcolor="#ffffff" align="left"><table width="100%" border="0" cellspacing="0" cellpadding="0"><tr><td bgcolor="#ffffff" align="center" style="padding:20px 30px 20px 30px"><table border="0" cellspacing="0" cellpadding="0"><tr><td align="center" style="" xbgcolor="#3a4b08"><a hrefx="#" style="font-size:50px;letter-spacing:20px;font-family:Helvetica,Arial,sans-serif;color:#fff;text-decoration:none;text-decoration:none;padding:15px 5px 15px 25px;border-radius:2px;border:1px solid #5650de;display:inline-block;background:linear-gradient(135deg,#f869d5 0,#5650de 100%)!important;border-radius:6px">{{code}}</a></td></tr></table></td></tr></table></td></tr><tr><td bgcolor="#ffffff" align="left" style="padding:20px;font-family:Helvetica,Arial,sans-serif;color:#666;font-size:14px"><hr style="margin-top:100px"><p style="margin:0;text-align:center;padding:10px;font-size:12px;padding-top:0">info@peldating.com</p><p style="margin:0;text-align:center;padding:10px;font-size:12px;padding-top:0">© 2023 All Rights Reserved</p><p style="margin:0;text-align:center;padding:10px;font-size:12px;padding-top:0"><a href="{{policy_url}}">Privacy Policy</a>&nbsp;&nbsp;<a href="{{terms_url}}">Terms & Conditions</a></p></td></tr></table></td></tr></table></body>
</html>`;

const template_account_approval = `<html>
    <head>
        <title></title>
        <style type="text/css">
            @media screen{@font-face{font-family:Lato;font-style:normal;font-weight:400;src:local("Lato Regular"),local("Lato-Regular"),url(https://fonts.gstatic.com/s/lato/v11/qIIYRU-oROkIk8vfvxw6QvesZW2xOQ-xsNqO47m55DA.woff) format("woff")}@font-face{font-family:Lato;font-style:normal;font-weight:700;src:local("Lato Bold"),local("Lato-Bold"),url(https://fonts.gstatic.com/s/lato/v11/qdgUG4U09HnJwhYI-uK18wLUuEpTyoUstqEm5AMlJo4.woff) format("woff")}@font-face{font-family:Lato;font-style:italic;font-weight:400;src:local("Lato Italic"),local("Lato-Italic"),url(https://fonts.gstatic.com/s/lato/v11/RYyZNoeFgb0l7W3Vu1aSWOvvDin1pK8aKteLpeZ5c0A.woff) format("woff")}@font-face{font-family:Lato;font-style:italic;font-weight:700;src:local("Lato Bold Italic"),local("Lato-BoldItalic"),url(https://fonts.gstatic.com/s/lato/v11/HkF_qI1x_noxlxhrhMQYELO3LdcAZYWl9Si6vvxL-qU.woff) format("woff")}}a,body,table,td{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}table,td{mso-table-lspace:0;mso-table-rspace:0}img{-ms-interpolation-mode:bicubic}img{border:0;height:auto;line-height:100%;outline:0;text-decoration:none}table{border-collapse:collapse!important}body{height:100%!important;margin:0!important;padding:0!important;width:100%!important}a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important;font-size:inherit!important;font-family:inherit!important;font-weight:inherit!important;line-height:inherit!important}@media screen and (max-width:600px){h1{font-size:32px!important;line-height:32px!important}}div[style*="margin: 16px 0;"]{margin:0!important}
        </style>
    </head>
    <body style="background-color:#f4f4f4;margin:0!important;padding:0!important"><table border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td align="center" style="padding:0 10px 0 10px;"><table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;border-top-right-radius:6px;border-top-left-radius:6px"><tr><td xbgcolor="#ffffff" xalign="center" valign="top" style="padding:40px 20px 20px 20px;border-radius:4px 4px 0 0;color:#111;font-family:Lato,Helvetica,Arial,sans-serif;font-size:48px;font-weight:400;letter-spacing:4px;line-height:48px;display:flex;justify-content:center;align-items:center"><img src="{{logo_url_one}}" alt="PEL"></td></tr></table></td></tr><tr><td bgcolor="#ffffff" align="center" style="padding:0 10px 0 10px"><table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:90%"><tr><td bgcolor="#ffffff" align="left" style="padding:20px 30px 20px 30px;color:#666;font-family:Helvetica,Arial,sans-serif;font-size:18px;font-weight:400;line-height:25px"><p style="margin:0;font-size:14px">Hey {{name}}!</p><p style="margin:0;margin-top:10px;font-size:14px">Exciting news — your account on PEL has been approved! 🎉 Welcome to our vibrant community of PEL enthusiasts. We're thrilled to have you join us on this journey!<br><br>Head over to PEL Mobile application and log in using your credentials. 📱<br><br>Happy exploring!<br><br>Best regards,<br>PEL Dating Team</p></td></tr><tr><td bgcolor="#ffffff" align="left" style="padding:20px;font-family:Helvetica,Arial,sans-serif;color:#666;font-size:14px"><hr style="margin-top:20px"><p style="margin:0;text-align:center;padding:10px;font-size:12px;padding-top:0">info@peldating.com</p><p style="margin:0;text-align:center;padding:10px;font-size:12px;padding-top:0">© 2023 All Rights Reserved</p><p style="margin:0;text-align:center;padding:10px;font-size:12px;padding-top:0"><a href="{{policy_url}}">Privacy Policy</a>&nbsp;&nbsp;<a href="{{terms_url}}">Terms & Conditions</a></p></td></tr></table></td></tr></table></body>
</html>`;


const template_account_rejection = `<html>
    <head>
        <title></title>
        <style type="text/css">
            @media screen{@font-face{font-family:Lato;font-style:normal;font-weight:400;src:local("Lato Regular"),local("Lato-Regular"),url(https://fonts.gstatic.com/s/lato/v11/qIIYRU-oROkIk8vfvxw6QvesZW2xOQ-xsNqO47m55DA.woff) format("woff")}@font-face{font-family:Lato;font-style:normal;font-weight:700;src:local("Lato Bold"),local("Lato-Bold"),url(https://fonts.gstatic.com/s/lato/v11/qdgUG4U09HnJwhYI-uK18wLUuEpTyoUstqEm5AMlJo4.woff) format("woff")}@font-face{font-family:Lato;font-style:italic;font-weight:400;src:local("Lato Italic"),local("Lato-Italic"),url(https://fonts.gstatic.com/s/lato/v11/RYyZNoeFgb0l7W3Vu1aSWOvvDin1pK8aKteLpeZ5c0A.woff) format("woff")}@font-face{font-family:Lato;font-style:italic;font-weight:700;src:local("Lato Bold Italic"),local("Lato-BoldItalic"),url(https://fonts.gstatic.com/s/lato/v11/HkF_qI1x_noxlxhrhMQYELO3LdcAZYWl9Si6vvxL-qU.woff) format("woff")}}a,body,table,td{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}table,td{mso-table-lspace:0;mso-table-rspace:0}img{-ms-interpolation-mode:bicubic}img{border:0;height:auto;line-height:100%;outline:0;text-decoration:none}table{border-collapse:collapse!important}body{height:100%!important;margin:0!important;padding:0!important;width:100%!important}a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important;font-size:inherit!important;font-family:inherit!important;font-weight:inherit!important;line-height:inherit!important}@media screen and (max-width:600px){h1{font-size:32px!important;line-height:32px!important}}div[style*="margin: 16px 0;"]{margin:0!important}
        </style>
    </head>
    <body style="background-color:#f4f4f4;margin:0!important;padding:0!important"><table border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td align="center" style="padding:0 10px 0 10px;"><table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;border-top-right-radius:6px;border-top-left-radius:6px"><tr><td xbgcolor="#ffffff" xalign="center" valign="top" style="padding:40px 20px 20px 20px;border-radius:4px 4px 0 0;color:#111;font-family:Lato,Helvetica,Arial,sans-serif;font-size:48px;font-weight:400;letter-spacing:4px;line-height:48px;display:flex;justify-content:center;align-items:center"><img src="{{logo_url_one}}" alt="PEL"></td></tr></table></td></tr><tr><td bgcolor="#ffffff" align="center" style="padding:0 10px 0 10px"><table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:90%"><tr><td bgcolor="#ffffff" align="left" style="padding:20px 30px 20px 30px;color:#666;font-family:Helvetica,Arial,sans-serif;font-size:18px;font-weight:400;line-height:25px"><p style="margin:0;font-size:14px">Hello {{name}},</p><p style="margin:0;margin-top:10px;font-size:14px">We hope this message finds you well. Thank you for your interest in joining PEL.<br>After a careful review of your account, we regret to inform you that your profile picture does not meet our guidelines.<br><br>Photos must clearly show your full face without sunglasses and other people. Here are things we don’t allow in photos.<br>1. Sunglasses<br>2. No Filter e.g. snapchat filters<br>3. No face tuning photos<br>4. Blurry or unclear face<br>5. More than one person<br>6. Nudity<br>7. Child or adolescent<br>8. Celebrity photo<br><br>We understand that this may be disappointing, but we strive to maintain a safe and positive environment for all users. To rectify this, we kindly ask you to update your profile picture by login into app.<br><br>Best regards,<br>PEL Dating Team</p></td></tr><tr><td bgcolor="#ffffff" align="left" style="padding:20px;font-family:Helvetica,Arial,sans-serif;color:#666;font-size:14px"><hr style="margin-top:20px"><p style="margin:0;text-align:center;padding:10px;font-size:12px;padding-top:0">info@peldating.com</p><p style="margin:0;text-align:center;padding:10px;font-size:12px;padding-top:0">© 2023 All Rights Reserved</p><p style="margin:0;text-align:center;padding:10px;font-size:12px;padding-top:0"><a href="{{policy_url}}">Privacy Policy</a>&nbsp;&nbsp;<a href="{{terms_url}}">Terms & Conditions</a></p></td></tr></table></td></tr></table></body>
</html>`;


const sendEmail = async (sendSmtpEmail) => {
    try {
        let result = await apiInstance.sendTransacEmail(sendSmtpEmail).then(function (data) {
            
            console.log('API called successfully. Returned data: ' + JSON.stringify(data));
            return data
        }, function (error) {
            console.error('server error' + error);
        });        
        return result;
    } catch (err) {
        console.log('{{error}} ' + err);
    }
};

const emailProcessor = (email, subject, body) => {
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = utils.getEmailTemplate(body);
    sendSmtpEmail.sender = { "name": process.env.BREVO_SMTP_FROM_NAME, "email": process.env.BREVO_SMTP_FROM_EMAIL };
    sendSmtpEmail.to = [
        { "email": email }
    ];    
    return sendEmail(sendSmtpEmail);
};

const sendWelcomeEmail = async (email) => {
    let subject = '🌟 Welcome to PEL - Let the Adventure Begin! 🌈';
    let template = template_welcome;
    let params = {
        'logo_url_one' : config.app_base_url+'/admin/assets/img/logo/logo_email_small.png',
        'logo_url_two' : config.app_base_url+'/admin/assets/img/logo/mpel_small.png',
        'terms_url' : '#',
        'policy_url' : '#',
    }
    for (const [key, value] of Object.entries(params)) {
        template = template.replace('{{' + key + '}}', value);
    }
    return await emailProcessor(email, subject, template);
}

const sendOTPEmail = async (email,otp_code) => {
    let subject = 'PEL - Verify your email address';
    let template = template_otp;
    let params = {
        'logo_url_one' : config.app_base_url+'/admin/assets/img/logo/logo_email_small.png',
        'logo_url_two' : config.app_base_url+'/admin/assets/img/logo/mpel_small.png',
        'code' : otp_code,
        'terms_url' : '#',
        'policy_url' : '#',
    }
    for (const [key, value] of Object.entries(params)) {
        template = template.replace('{{' + key + '}}', value);
    }
    return await emailProcessor(email, subject, template);
}

const sendForgotPasswordEmail = async (email,otp_code) => {
    let subject = 'PEL - OTP to reset your password';
    let template = template_forgot_password;
    let params = {
        'logo_url_one' : config.app_base_url+'/admin/assets/img/logo/logo_email_small.png',
        'logo_url_two' : config.app_base_url+'/admin/assets/img/logo/mpel_small.png',
        'code' : otp_code,
        'terms_url' : '#',
        'policy_url' : '#',
    }
    for (const [key, value] of Object.entries(params)) {
        template = template.replace('{{' + key + '}}', value);
    }
    return await emailProcessor(email, subject, template);
}

const sendAccountApprovedEmail = async (email,name) => {
    let subject = '🎉 Account Approved! Welcome to PEL 🚀';
    let template = template_account_approval;
    let params = {
        'logo_url_one' : config.app_base_url+'/admin/assets/img/logo/logo_email_small.png',
        'logo_url_two' : config.app_base_url+'/admin/assets/img/logo/mpel_small.png',
        'terms_url' : '#',
        'policy_url' : '#',
        'name': name
    }
    for (const [key, value] of Object.entries(params)) {
        template = template.replace('{{' + key + '}}', value);
    }
    return await emailProcessor(email, subject, template);
}

const sendAccountRejectionEmail = async (email,name) => {
    let subject = '🚫 Account Update - PEL';
    let template = template_account_rejection;
    let params = {
        'logo_url_one' : config.app_base_url+'/admin/assets/img/logo/logo_email_small.png',
        'logo_url_two' : config.app_base_url+'/admin/assets/img/logo/mpel_small.png',
        'terms_url' : '#',
        'policy_url' : '#',
        'name': name
    }
    for (const [key, value] of Object.entries(params)) {
        template = template.replace('{{' + key + '}}', value);
    }
    return await emailProcessor(email, subject, template);
}


module.exports = {emailProcessor, sendOTPEmail, sendWelcomeEmail, sendAccountApprovedEmail, sendAccountRejectionEmail, sendForgotPasswordEmail};
