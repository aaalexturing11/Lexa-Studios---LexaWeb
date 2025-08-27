
let scrollEjecutado = false;

window.addEventListener(
  "wheel",
  function (e) {
    const seccion = document.querySelector("#seccion-principal");
    if (e.deltaY > 0 && window.scrollY < 50 && !scrollEjecutado) {
      e.preventDefault();
      scrollEjecutado = true;
      seccion.scrollIntoView({ behavior: "smooth" });
    }
  },
  { passive: false }
);

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

// Para mostrar la introducción de "Lexa Studios" solo una vez
const intro = document.getElementById("intro-lexa");

if (localStorage.getItem("introMostrada")) {
  document.body.classList.add("loaded");
  intro.style.display = "none";
} else {
  window.addEventListener("load", () => {
    setTimeout(() => {
      document.body.classList.add("loaded");
      intro.style.display = "none";
      localStorage.setItem("introMostrada", "true");
    }, 6500);
  });
}
