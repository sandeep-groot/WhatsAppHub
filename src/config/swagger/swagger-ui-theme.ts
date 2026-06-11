/** Inline CSS/JS for Swagger UI light + dark theme toggle (no static assets required). */

export const SWAGGER_THEME_CSS = `
.swagger-theme-toggle {
  position: fixed;
  top: 12px;
  right: 16px;
  z-index: 9999;
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid #c9c9c9;
  background: #fff;
  color: #1a1a1a;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.swagger-theme-toggle:hover {
  background: #f4f4f5;
}

html[data-swagger-theme='dark'] .swagger-theme-toggle {
  border-color: #3f3f46;
  background: #27272a;
  color: #fafafa;
}
html[data-swagger-theme='dark'] .swagger-theme-toggle:hover {
  background: #3f3f46;
}

html[data-swagger-theme='dark'] body,
html[data-swagger-theme='dark'] .swagger-ui {
  background: #18181b;
  color: #e4e4e7;
}
html[data-swagger-theme='dark'] .swagger-ui .topbar {
  background: #09090b;
}
html[data-swagger-theme='dark'] .swagger-ui .info .title,
html[data-swagger-theme='dark'] .swagger-ui .info p,
html[data-swagger-theme='dark'] .swagger-ui .info li,
html[data-swagger-theme='dark'] .swagger-ui .info a,
html[data-swagger-theme='dark'] .swagger-ui .opblock-tag,
html[data-swagger-theme='dark'] .swagger-ui section.models h4,
html[data-swagger-theme='dark'] .swagger-ui .model-title,
html[data-swagger-theme='dark'] .swagger-ui table thead tr th,
html[data-swagger-theme='dark'] .swagger-ui table thead tr td,
html[data-swagger-theme='dark'] .swagger-ui .parameter__name,
html[data-swagger-theme='dark'] .swagger-ui .response-col_status,
html[data-swagger-theme='dark'] .swagger-ui label {
  color: #e4e4e7;
}
html[data-swagger-theme='dark'] .swagger-ui .opblock .opblock-summary-path,
html[data-swagger-theme='dark'] .swagger-ui .opblock .opblock-summary-description {
  color: #fafafa;
}
html[data-swagger-theme='dark'] .swagger-ui .opblock {
  border-color: #3f3f46;
  background: #27272a;
  box-shadow: none;
}
html[data-swagger-theme='dark'] .swagger-ui .opblock .opblock-section-header {
  background: #3f3f46;
  border-color: #52525b;
}
html[data-swagger-theme='dark'] .swagger-ui .opblock .opblock-section-header h4 {
  color: #fafafa;
}
html[data-swagger-theme='dark'] .swagger-ui .opblock-body pre,
html[data-swagger-theme='dark'] .swagger-ui .model-box,
html[data-swagger-theme='dark'] .swagger-ui .model {
  background: #09090b;
  color: #e4e4e7;
}
html[data-swagger-theme='dark'] .swagger-ui .btn {
  color: #fafafa;
  border-color: #52525b;
  background: #3f3f46;
}
html[data-swagger-theme='dark'] .swagger-ui .btn:hover {
  background: #52525b;
}
html[data-swagger-theme='dark'] .swagger-ui input[type='text'],
html[data-swagger-theme='dark'] .swagger-ui textarea,
html[data-swagger-theme='dark'] .swagger-ui select {
  background: #09090b;
  color: #e4e4e7;
  border-color: #52525b;
}
html[data-swagger-theme='dark'] .swagger-ui .scheme-container {
  background: #27272a;
  box-shadow: none;
  border-color: #3f3f46;
}
html[data-swagger-theme='dark'] .swagger-ui section.models {
  border-color: #3f3f46;
  background: #27272a;
}
html[data-swagger-theme='dark'] .swagger-ui .model-container {
  background: #18181b;
}
html[data-swagger-theme='dark'] .swagger-ui .markdown code,
html[data-swagger-theme='dark'] .swagger-ui .renderedMarkdown code {
  background: #3f3f46;
  color: #fafafa;
}
`;

export const SWAGGER_THEME_TOGGLE_JS = `
(function () {
  var STORAGE_KEY = 'whatsapp-hub-swagger-theme';

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-swagger-theme', theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {}
    var btn = document.getElementById('swagger-theme-toggle');
    if (btn) {
      btn.textContent = theme === 'dark' ? 'Light mode' : 'Dark mode';
      btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }
  }

  function getPreferredTheme() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) {}
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  function mountToggle() {
    if (document.getElementById('swagger-theme-toggle')) return;
    var btn = document.createElement('button');
    btn.id = 'swagger-theme-toggle';
    btn.type = 'button';
    btn.className = 'swagger-theme-toggle';
    btn.addEventListener('click', function () {
      var current = document.documentElement.getAttribute('data-swagger-theme') || 'light';
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
    document.body.appendChild(btn);
    applyTheme(getPreferredTheme());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountToggle);
  } else {
    mountToggle();
  }
})();
`;

export const SWAGGER_UI_CDN = {
  css: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css',
  bundle:
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.js',
  standalone:
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.js',
} as const;