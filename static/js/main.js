document.addEventListener("DOMContentLoaded", () => {
  const filterForm = document.getElementById("filter-form");
  if (filterForm) {
    const autoFields = filterForm.querySelectorAll(".filter-auto");
    autoFields.forEach((el) => {
      el.addEventListener("change", () => filterForm.submit());
    });
  }

  const deleteForms = document.querySelectorAll("form.delete-form");
  deleteForms.forEach((form) => {
    form.addEventListener("submit", (e) => {
      const ok = confirm(
        "Delete this complaint and all its documents? This cannot be undone."
      );
      if (!ok) e.preventDefault();
    });
  });
});


