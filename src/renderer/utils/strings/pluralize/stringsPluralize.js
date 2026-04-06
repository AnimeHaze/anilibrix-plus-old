export default (count, words) => {
  if (!Array.isArray(words) || words.length === 0) {
    return `${count}`
  }

  if (words.length === 2) {
    return `${count} ${count === 1 ? words[0] : words[1]}`
  }

  const cases = [2, 0, 1, 1, 1, 2]
  const value = words[(count % 100 > 4 && count % 100 < 20) ? 2 : cases[Math.min(count % 10, 5)]]

  return `${count} ${value}`
}
