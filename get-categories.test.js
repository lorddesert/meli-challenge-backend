import { test } from "node:test"
import assert from 'node:assert/strict';
import { getCategories } from './index.js';

test("Get categories of a given ID", async () => {
  // Given
  const CATEGORY_TO_TEST_ID = "MLA1073"
  const MOCK_EXACT_DATA = [
    { id: 'MLA1071', name: 'Animales y Mascotas' },
    { id: 'MLA1072', name: 'Perros' },
    { id: 'MLA1073', name: 'Perros de Raza' }
  ]


  // When
  const res = await getCategories({
    categoryID: CATEGORY_TO_TEST_ID
  })

  if (!res.ok) {
    console.log(res, CATEGORY_TO_TEST_ID)

    throw new Error('ERR: Something went wrong')
  }

  const { path_from_root } = await res.json()

  // Then
  assert.deepEqual(path_from_root, MOCK_EXACT_DATA)
})
