<?php
/**
 * footer.php — Shared PHP footer included in every server-rendered page.
 * Boots the SPA shell for interactive elements (header nav, cart, auth, etc.)
 *
 * The JS app reads window.__SSR_PAGE__ to know it's running in hydration mode.
 * It skips rendering the main content area but still boots the header/footer
 * interactive components (cart counter, dark mode toggle, auth buttons, etc.)
 */

// $js_file is set in header.php (same include scope)
?>

  <!-- SPA shell: boots header, cart, auth, dark-mode on server-rendered pages -->
  <?php if (!empty($js_file)): ?>
  <script type="module" src="<?= htmlspecialchars($js_file) ?>"></script>
  <?php endif; ?>
</body>
</html>
