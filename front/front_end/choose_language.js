if (!localStorage.getItem("Language")) 
    document.getElementById('language').value = "En";
else
    document.getElementById('language').value = localStorage.getItem("Language");
document.getElementById('language').addEventListener('change', function() 
{
    const selectedLanguage = this.value;
    localStorage.setItem("Language", selectedLanguage);
    i18next.changeLanguage(selectedLanguage, () => 
    {
          updateContent();
    });
});
 