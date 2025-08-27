// Mostrar/ocultar botón según scroll con animación
const btnScrollTop = document.getElementById("btn-scroll-top");
window.addEventListener("scroll", () => {
  if (window.scrollY > 200) {
    btnScrollTop.classList.add("show");
  } else {
    btnScrollTop.classList.remove("show");
  }
});
btnScrollTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});