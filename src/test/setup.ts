import "@testing-library/jest-dom/vitest";

// jsdom does not implement the native dialog lifecycle. Browser checks cover
// focus management and inert background behavior supplied by showModal().
if (typeof HTMLDialogElement !== "undefined" && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
}
