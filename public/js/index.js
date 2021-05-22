
window.onload = function () {
  const destination = document.getElementById("destination");
  const date = document.getElementById("date");
  const persons = document.getElementById("persons");
  const next = document.getElementById("btn");
  next.addEventListener("click", () => {
    const url = new URL("http://localhost:3000/api/1.0/passenger-search-result.html");
    console.log(persons.value);
    const searchParams = new URLSearchParams({
      destination: destination.value,
      date: date.value,
      persons: persons.value
    });

    url.search = searchParams;
    console.log(url.href);
    document.location.href = url.href;
  });
};
