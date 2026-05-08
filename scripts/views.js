/** @type {WeakMap<HTMLDialogElement, HTMLElement>} */
const openerByDialog = new WeakMap();
const VT_PARTS = [
  ["card", "[data-vt-card]"],
  ["image", "[data-vt-image]"],
  ["title", "[data-vt-title]"],
  ["type", "[data-vt-type]"],
  ["subtitle", "[data-vt-subtitle]"],
  ["meta", "[data-vt-meta]"],
  ["footer", "[data-vt-footer]"],
];

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getOpenerForDialog(modal) {
  return (
    openerByDialog.get(modal) ||
    document.querySelector(`[data-open-modal="${modal.dataset.modal}"]`)
  );
}

function clearScopedNames() {
  VT_PARTS.forEach(([, selector]) => {
    document.querySelectorAll(selector).forEach((el) => {
      el.style.viewTransitionName = "";
    });
  });
}

function collectScopedElements(root) {
  if (!(root instanceof Element)) return {};
  const out = {};
  VT_PARTS.forEach(([key, selector]) => {
    out[key] = root.matches(selector) ? root : root.querySelector(selector);
  });
  return out;
}

function applyScopedNames(elements, prefix) {
  VT_PARTS.forEach(([key]) => {
    const el = elements[key];
    if (el) el.style.viewTransitionName = `${prefix}-${key}`;
  });
}

function clearNamesForElements(elements) {
  VT_PARTS.forEach(([key]) => {
    const el = elements[key];
    if (el) el.style.viewTransitionName = "";
  });
}

function rememberOpener(modal, button) {
  openerByDialog.set(modal, button);
}

function forgetOpener(modal) {
  openerByDialog.delete(modal);
}

// --- OPENING TRANSITION LOGIC ---
function getModalTransitionTarget(modal) {
  if (!(modal instanceof HTMLDialogElement)) return null;
  return modal.querySelector(".peek-shell") || modal;
}

function handleModalTransition(button, modal) {
  if (!modal) return;

  rememberOpener(modal, button);

  if (!document.startViewTransition || prefersReducedMotion()) {
    modal.showModal();
    requestAnimationFrame(() => modal.classList.add("peek-open"));
    return;
  }

  const target = getModalTransitionTarget(modal);
  if (!target) return;
  target.classList.remove("enable-top-hover");

  const sourceElements = collectScopedElements(button);
  const targetElements = collectScopedElements(target);
  const scopeId = button.dataset.openModal || modal.dataset.modal || "modal";
  const prefix = `vt-${scopeId}`;
  const hasScopedPair = Boolean(sourceElements.card && targetElements.card);

  if (!hasScopedPair) {
    button.classList.add("modal-transition-element");
    document
      .startViewTransition(() => {
        button.style.visibility = "hidden";
        modal.showModal();
        target.classList.add("modal-transition-element");
        modal.classList.add("peek-open");
      })
      .finished.then(() => {
        button.classList.remove("modal-transition-element");
        target.classList.remove("modal-transition-element");
      });
    return;
  }

  clearScopedNames();
  applyScopedNames(sourceElements, prefix);

  document
    .startViewTransition(() => {
      button.style.visibility = "hidden";
      modal.showModal();
      modal.classList.add("peek-open");
      clearNamesForElements(sourceElements);
      applyScopedNames(targetElements, prefix);
    })
    .finished.then(() => {
      clearNamesForElements(targetElements);
    });
}

// --- CLOSING TRANSITION LOGIC ---
function handleModalCloseTransition(modal, openButton) {
  const opener = openButton || getOpenerForDialog(modal);
  if (!modal) return;

  if (!opener) {
    modal.close();
    modal.classList.remove("peek-open");
    forgetOpener(modal);
    return;
  }

  if (!document.startViewTransition || prefersReducedMotion()) {
    modal.close();
    opener.style.visibility = "";
    modal.classList.remove("peek-open");
    forgetOpener(modal);
    return;
  }

  const target = getModalTransitionTarget(modal);
  if (!target) return;
  target.classList.remove("enable-top-hover");

  const sourceElements = collectScopedElements(opener);
  const targetElements = collectScopedElements(target);
  const scopeId = opener.dataset.openModal || modal.dataset.modal || "modal";
  const prefix = `vt-${scopeId}`;
  const hasScopedPair = Boolean(sourceElements.card && targetElements.card);

  if (!hasScopedPair) {
    target.classList.add("modal-transition-element");
    modal.classList.remove("peek-open");
    document
      .startViewTransition(() => {
        opener.style.visibility = "visible";
        modal.close();
        opener.classList.add("modal-transition-element");
      })
      .finished.then(() => {
        target.classList.remove("modal-transition-element");
        opener.classList.remove("modal-transition-element");
        opener.style.visibility = "";
        forgetOpener(modal);
      });
    return;
  }

  clearScopedNames();
  applyScopedNames(targetElements, prefix);

  document
    .startViewTransition(() => {
      opener.style.visibility = "visible";
      modal.close();
      clearNamesForElements(targetElements);
      applyScopedNames(sourceElements, prefix);
    })
    .finished.then(() => {
      clearNamesForElements(sourceElements);
      opener.style.visibility = "";
      forgetOpener(modal);
    });
}

function ensureDialogCleanup(dialog) {
  if (!(dialog instanceof HTMLDialogElement) || !dialog.dataset.modal) return;
  if (dialog.dataset.peekCleanupBound) return;
  dialog.dataset.peekCleanupBound = "1";
  dialog.addEventListener("close", () => {
    const opener = getOpenerForDialog(dialog);
    if (opener) opener.style.visibility = "";
    dialog.classList.remove("peek-open");
    forgetOpener(dialog);
  });
}

document.querySelectorAll("dialog[data-modal]").forEach(ensureDialogCleanup);

new MutationObserver((mutations) => {
  for (const m of mutations) {
    for (const n of m.addedNodes) {
      if (n.nodeType !== Node.ELEMENT_NODE) continue;
      if (n instanceof HTMLDialogElement && n.dataset.modal)
        ensureDialogCleanup(n);
      n.querySelectorAll?.("dialog[data-modal]")?.forEach(ensureDialogCleanup);
    }
  }
}).observe(document.body, { childList: true, subtree: true });

// --- Delegated listeners (supports dynamically injected peek triggers) ---
document.addEventListener("click", (e) => {
  const openBtn =
    e.target instanceof Element ? e.target.closest("[data-open-modal]") : null;
  if (openBtn) {
    if (e.target.closest("[data-no-modal]")) {
      const url = openBtn.dataset.primaryUrl;
      if (url) window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    const id = openBtn.dataset.openModal;
    const modal = document.querySelector(`dialog[data-modal="${id}"]`);
    if (modal) {
      e.preventDefault();
      handleModalTransition(openBtn, modal);
    }
    return;
  }

  const closeBtn =
    e.target instanceof Element ? e.target.closest("[data-close-modal]") : null;
  if (closeBtn) {
    const modal = closeBtn.closest("dialog");
    if (!modal) return;
    const opener = getOpenerForDialog(modal);
    handleModalCloseTransition(modal, opener);
    return;
  }
});

document.addEventListener("click", (e) => {
  const dialog = e.target;
  if (!(dialog instanceof HTMLDialogElement)) return;
  if (e.target !== dialog) return;
  const opener = getOpenerForDialog(dialog);
  if (opener) handleModalCloseTransition(dialog, opener);
});

document.addEventListener(
  "cancel",
  (e) => {
    const modal = e.target;
    if (!(modal instanceof HTMLDialogElement) || !modal.dataset.modal) return;
    e.preventDefault();
    const opener = getOpenerForDialog(modal);
    handleModalCloseTransition(modal, opener);
  },
  true,
);

document.addEventListener(
  "pointerenter",
  (e) => {
    const trigger =
      e.target instanceof Element
        ? e.target.closest(".peek-modal-hover-link")
        : null;
    if (!(trigger instanceof HTMLAnchorElement)) return;
    const shell = trigger.closest(".peek-shell.has-top-trigger");
    if (!shell) return;
    shell.classList.add("enable-top-hover");
  },
  true,
);

document.addEventListener(
  "pointerleave",
  (e) => {
    const trigger =
      e.target instanceof Element
        ? e.target.closest(".peek-modal-hover-link")
        : null;
    if (!(trigger instanceof HTMLAnchorElement)) return;
    const shell = trigger.closest(".peek-shell.has-top-trigger");
    if (!shell) return;
    shell.classList.remove("enable-top-hover");
  },
  true,
);

document.addEventListener("pointermove", (e) => {
  document
    .querySelectorAll(".peek-shell.has-top-trigger.enable-top-hover")
    .forEach((shell) => {
      const hovered = document.elementFromPoint(e.clientX, e.clientY);
      if (!hovered || !hovered.closest(".peek-modal-hover-link")) {
        shell.classList.remove("enable-top-hover");
      }
    });
});
