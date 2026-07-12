<?php

/**
 * Допоміжні функції для роботи з деревом категорій.
 */
function getDescendantCategoryIds(mysqli $conn, int $categoryId): array
{
    $ids = [$categoryId];
    $queue = [$categoryId];

    while ($queue !== []) {
        $current = array_shift($queue);
        $stmt = $conn->prepare('SELECT id FROM categories WHERE parent_id = ?');
        $stmt->bind_param('i', $current);
        $stmt->execute();
        $result = $stmt->get_result();

        while ($row = $result->fetch_assoc()) {
            $childId = (int) $row['id'];
            $ids[] = $childId;
            $queue[] = $childId;
        }

        $stmt->close();
    }

    return array_values(array_unique($ids));
}
