
async function test() {
  const query = 'Imagine Dragons';
  const searchEngine = 'gaama';
  const url = `https://musicapi.x007.workers.dev/search?q=${encodeURIComponent(query)}&searchEngine=${encodeURIComponent(searchEngine)}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(e);
  }
}
test();
