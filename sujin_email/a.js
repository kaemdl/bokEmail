const email_content = document.getElementsByClassName("email_content");
const email_title = document.getElementsByClassName("email_title");
email_content.innerHTML.style.display = "none";

email_title.addEventListener("click", () => {
    if (email_content.innerHTML.style.display == "") {
        email_content.innerHTML.style.display = "none";
    }
    else {
        email_content.innerHTML.style.display = "";
    }
});