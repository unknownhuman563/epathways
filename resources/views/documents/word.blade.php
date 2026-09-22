<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
    <meta charset="UTF-8">
    <title>{{ $title }}</title>
    <!--[if gte mso 9]>
    <xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml>
    <![endif]-->
    <style>
        @page { size: A4; margin: 2.5cm 2cm; }
        body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #1a1a1a; }
        h1 { font-size: 17pt; }
        h2 { font-size: 13pt; }
        h3 { font-size: 11.5pt; }
        table { border-collapse: collapse; }
        td, th { border: 0.5pt solid #999; padding: 4pt 6pt; }
    </style>
</head>
<body>
    {!! $content !!}
</body>
</html>
