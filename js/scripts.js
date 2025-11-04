document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("clickBtn");
    const themeToggle = document.getElementById("theme-toggle");
    const body = document.body;

    btn.addEventListener("click", () => {
        alert("🎉 버튼을 클릭했어요! 환영합니다, Zo0su님!");
    });

    themeToggle.addEventListener("click", () => {
        body.classList.toggle("dark-mode");
        themeToggle.textContent = body.classList.contains("dark-mode")
            ? "☀️ 라이트모드"
            : "🌙 다크모드";
    });
});
