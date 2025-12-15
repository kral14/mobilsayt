import express from 'express'
import { createDocument, getDocuments, getDocumentById, updateDocument, deleteDocument } from '../controllers/discountDocumentController'

const router = express.Router()

router.post('/', createDocument)
router.get('/', getDocuments)
router.get('/:id', getDocumentById)

export default router
router.put('/:id', updateDocument)
router.delete('/:id', deleteDocument)
