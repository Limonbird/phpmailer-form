<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'php-mailer/src/Exception.php';
require 'php-mailer/src/PHPMailer.php';
require 'php-mailer/src/SMTP.php';


$mail = new PHPMailer(true);

// Данные полей из формы
$name = $_POST['name'];
$email = $_POST['email'];
$sex = $_POST['sex'];
$message = $_POST['message'];
$age = $_POST['age'];
$file = $_FILES['image'];

try {
    $mail->isSMTP();
    $mail->CharSet = 'UTF-8';
    $mail->setLanguage('ru', 'php-mailer/language/');
    $mail->SMTPAuth   = true;
    $mail->isHTML(true);
    // $mail->SMTPDebug = 2;
    $mail->Debugoutput = function ($str, $level) {
        $GLOBALS['status'][] = $str;
    };

    // Настройки почты, с которой будут идти письма.
    $mail->Host       = 'SMTP.yandex.ru'; // SMTP сервера почты
    $mail->Username   = '...'; // Логин от этой почты
    $mail->Password   = '...'; // Пароль от этой почты (не от ящика, а пароль для приложений).
    $mail->SMTPSecure = 'ssl';
    $mail->Port       = 465;
    $mail->setFrom('...@yandex.ru', 'Из тестовой формы');

    // Получатель письма
    $mail->addAddress($email); // для проверки уйдет на email из формы.

    // Письмо
    $mail->Subject = 'Проверка формы с php-mailer';

    // Прикрепление файлов к письму
    if (!empty($_FILES['image']['tmp_name'])) {
        $filePath = __DIR__ . "/files/" . $_FILES['image']['name']; // !! папка files должна быть на сервере

        if (copy($_FILES['image']['tmp_name'], $filePath)) {
            $fileAttach = $filePath;
            $mail->addAttachment($filePath);
        }
    }

    $body = "<h2>Новое письмо из тестовой формы!</h2>
            <p><b>Имя:</b> $name</p>
            <p><b>Почта:</b> $email</p>
            <p><b>Пол:</b> $sex</p>
            <p><b>Сообщение:</b> $message</p>
            <p><b>Возраст:</b> $age</p>";

    $mail->Body = $body;

    // Проверяем отравленность сообщения
    if ($mail->send()) {
        $result = "Письмо успешно отправлено!";
    } else {
        $result = "Ошибка при отправке письма!";
    }
} catch (Exception $e) {
    $result = "Ошибка при отправке письма!";
    $status = "Сообщение не было отправлено. Причина ошибки: {$mail->ErrorInfo}";
}

echo json_encode(["result" => $result, "resultfile" => $rfile, "status" => $status]);
