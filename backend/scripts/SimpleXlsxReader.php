<?php

/**
 * Простий читач .xlsx без зовнішніх бібліотек (ZipArchive + XML).
 */
class SimpleXlsxReader
{
    private const NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';

    public static function readRows(string $filePath): array
    {
        if (!file_exists($filePath)) {
            throw new RuntimeException("Файл не знайдено: {$filePath}");
        }

        $zip = new ZipArchive();
        if ($zip->open($filePath) !== true) {
            throw new RuntimeException('Не вдалося відкрити XLSX');
        }

        $sharedStrings = self::readSharedStrings($zip);
        $sheetXml = $zip->getFromName('xl/worksheets/sheet1.xml');
        $zip->close();

        if ($sheetXml === false) {
            throw new RuntimeException('Не знайдено sheet1.xml у файлі XLSX');
        }

        return self::parseSheet($sheetXml, $sharedStrings);
    }

    private static function readSharedStrings(ZipArchive $zip): array
    {
        $xml = $zip->getFromName('xl/sharedStrings.xml');
        if ($xml === false) {
            return [];
        }

        $doc = new SimpleXMLElement($xml);
        $doc->registerXPathNamespace('m', self::NS);
        $strings = [];

        foreach ($doc->xpath('//m:si') as $si) {
            $si->registerXPathNamespace('m', self::NS);
            $parts = $si->xpath('.//m:t');
            $text = '';
            foreach ($parts as $part) {
                $text .= (string) $part;
            }
            $strings[] = $text;
        }

        return $strings;
    }

    private static function parseSheet(string $xml, array $sharedStrings): array
    {
        $doc = new SimpleXMLElement($xml);
        $doc->registerXPathNamespace('m', self::NS);
        $rows = [];

        foreach ($doc->xpath('//m:sheetData/m:row') as $row) {
            $row->registerXPathNamespace('m', self::NS);
            $cells = [];

            foreach ($row->xpath('m:c') as $cell) {
                $ref = (string) $cell['r'];
                $colIndex = self::columnIndexFromCellRef($ref);
                $cells[$colIndex] = self::cellValue($cell, $sharedStrings);
            }

            if ($cells === []) {
                continue;
            }

            $maxIndex = max(array_keys($cells));
            $rowValues = array_fill(0, $maxIndex + 1, '');

            foreach ($cells as $index => $value) {
                $rowValues[$index] = $value;
            }

            $rows[] = $rowValues;
        }

        return $rows;
    }

    private static function cellValue(SimpleXMLElement $cell, array $sharedStrings): string
    {
        $type = (string) $cell['t'];
        $cell->registerXPathNamespace('m', self::NS);
        $valueNode = $cell->xpath('m:v');

        if ($valueNode === false || count($valueNode) === 0) {
            return '';
        }

        $value = (string) $valueNode[0];

        if ($type === 's') {
            return $sharedStrings[(int) $value] ?? '';
        }

        return $value;
    }

    private static function columnIndexFromCellRef(string $ref): int
    {
        preg_match('/^([A-Z]+)/', $ref, $matches);
        $letters = $matches[1];
        $index = 0;

        for ($i = 0; $i < strlen($letters); $i++) {
            $index = $index * 26 + (ord($letters[$i]) - 64);
        }

        return $index - 1;
    }
}
