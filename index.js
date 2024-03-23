import express from "express";

const app = express()
const PORT = 3000
const API_URL = "https://api.mercadolibre.com"
app.use(express.json())

class MemoryStateFactory {
  constructor(stateName, initialValue) {
    this[stateName] = initialValue
  }

  getValue() {
    return this.stateName
  }

  setValue(newState) {
    this.stateName = newState
  }
}

let user = new MemoryStateFactory("username", "")

app.post("/api/register", (req, res) => {
  const { name, lastname } = req.body
  console.log(req.body)

  user.setValue(`${name},${lastname}`)
  res.send(getUsername())
})

app.get("/api/user", (_, res) => {
  res.send(getUsername())
})

app.get("/", (req, res) => {
  res.send("Status OK")
})

app.get("/api/items", async (req, res) => {
  if (!req?.query?.q) {
    res.status(400).send("Bad request, use the format: '/api/items?q=' ")
  }

  const { q } = req.query
  const response = await getSearchResults({ q })

  if (!response.ok) {
    res.status(500).send(JSON.stringify(response))
  }

  const { results } = await response.json()
  const mostRepeatedCategoryID = getMostRepeatedCategoryID({ searchResults: results })

  const categoriesResponse = await getCategories({ categoryID: mostRepeatedCategoryID })
  const { path_from_root } = await categoriesResponse.json()

  const items = parseSearchResults({
    data: results,
    categories: path_from_root
  })

  res.send(items)
})

app.get("/api/items/:id", async (req, res) => {

  if (!req.params.id) {
    res.status(400).send('Bad request, use format https://www.example.com/items:id ')
  }

  const itemResponse = await fetch(`${API_URL}/items/${req.params.id}`)
  const item = await itemResponse.json()

  const descriptionResponse = await fetch(`${API_URL}/items/${req.params.id}/description`)
  const { text: description } = await descriptionResponse.json()
  const categoriesResponse = await getCategories({ categoryID: item.category_id })
  const { path_from_root: categories } = await categoriesResponse.json()

  res.send(parseItemByID({ item, description, categories }))
})


app.listen(PORT, () => {
  console.log(`Listening in port ${PORT}`)
})


function getMostRepeatedCategoryID({ searchResults }) {
  let repeatedCategories = {}

  searchResults.forEach(({ category_id }) => {
    if (!repeatedCategories[category_id]) {
      repeatedCategories[category_id] = 1
      return
    }

    repeatedCategories[category_id]++
  })

  const mostRepeatedCategory = Object.entries(repeatedCategories)
    .sort((a, b) => {
      if (a[1] > b[1]) return -1;
      if (a[1] < b[1]) return 1;
      return 0;
    })[0]


  return mostRepeatedCategory[0] // in position 0 is the ID String
}

export function getUsername() {
  const username = user.getValue()

  if (!username)
    return "John,Doe".split(',')

  const [name, lastname] = username.split(',')

  return { name, lastname }
}

export function parseSearchResults({ data, categories }) {
  const { name, lastname } = getUsername()
  return {
    author: {
      name,
      lastname
    },
    categories,
    items: data,
  }
}

/**
 * Receives the most repeatead Category ID from the search result
 * 
 * @param {number} categoryID most repeatead Category ID from the search result
 * @returns
 */
export async function getCategories({ categoryID }) {
  return await fetch(`${API_URL}/categories/${categoryID}`)
}

async function getSearchResults({ q }) {
  return await fetch(`${API_URL}/sites/MLA/search?q=${q}`)
}

function parseItemByID({ item, description, categories }) {

  const { name, lastname } = getUsername()
  const { id, title, currency_id: currency, price, pictures, condition, shipping, initial_quantity, descriptions } = item
  return {
    author: {
      name,
      lastname
    },
    item: {
      id,
      title,
      price: {
        currency,
        amount: price,
        decimals: 0,
      },
      picture: pictures[0],
      condition,
      free_shipping: shipping.free_shipping,
      sold_quantity: initial_quantity,
      description,
      categories
    }

  }
}