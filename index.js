import express from "express";

const app = express()
const PORT = 3000
const API_URL = "https://api.mercadolibre.com"
const ITEMS_LIMIT = 4 // MAX 50
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

app.post("/register", (req, res) => {
    const { name, lastname } = req.body

    user.setValue(`${name}, ${lastname}`)
    res.send(user.getValue())
})

app.get("/user", (_, res) => {
    res.send(user.getValue())
})

app.get("/", (req, res) => {
    res.send("Status OK")
})


app.get("/api/items", async (req, res) => {

    async function getSearchResults({ q }) {
        return await fetch(`${API_URL}/sites/MLA/search?q=${q}`)
    }

    if (!req?.query?.q) {
        res.status(400).send("Bad request, use the '/api/items?q=' format.")
    }
    const { q } = req.query
    const response = await getSearchResults({ q })

    if (!response.ok) {
        res.status(500).send(JSON.stringify(response))
    }

    const { results } = await response.json()
    // const categories = getCategories()
    const items = parseSearchResults({
        data: results
    })

    res.send(items.slice(0, ITEMS_LIMIT))
})




app.listen(PORT, () => {
    console.log(`Listening in port ${PORT}`)
})

export function getUsername() {
    if (!username) return "John, Doe"

    const [name, lastname] = username.split(',')

    return { name, lastname }
}

export function parseSearchResults({ data }) {
    const { name, lastname } = getUsername()
    const { categories, results } = data

    return data.map(() => ({
        author: {
            name,
            lastname
        },
        categories,
        items: results
    }))
}

/**
 * 
 * @param {number} categoryID 
 * @returns
 */
export async function getCategories({ categoryID }) {
    return await fetch(`${API_URL}/categories/${categoryID}`)
}

