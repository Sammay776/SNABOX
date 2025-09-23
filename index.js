import dotenv from 'dotenv'
import express from 'express'
import { createClient } from '@supabase/supabase-js'
import multer from 'multer'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import { formatLogMessage } from './utils.js'

// Load env things
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Rate Limit
// depend on traffic.

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15min
    max: 100,
    message: 'Too many requests, please slow down.'
})

app.use(cors())
app.use(express.json())
app.use(limiter)

//  Supabase setup 
//  (service vs anon) key. imp
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

//  File upload config
// asccepted types of file  
const acceptedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/plain'
]

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // aaprox5 MB
    fileFilter: (req, file, cb) => {
        if (acceptedTypes.includes(file.mimetype)) {
            cb(null, true)
        } else {
            cb(new Error('Unsupported file type.'), false)
        }
    }
})

// Request logger
app.use((req, _, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
    next()
})

//  Auth Middlewere 
async function requireAuth(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
        return res.status(401).send({ error: 'Auth token missing' })
    }

    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) {
        return res.status(401).send({ error: 'Invalid or expired token' })
    }

    // attach user + scoped client to request
    req.user = user
    req.supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${token}` } }
    })

    next()
}

                                    // Auth Routes
app.post('/register', async (req, res, next) => {
    const { email, password } = req.body || {}
    if (!email || !password) {
        return res.status(400).send({ error: 'Email and password required' })
    }

    try {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) {
            if (error.message.includes('already registered')) {
                return res.status(409).send({ error: 'User already exists' })
            }
            throw error
        }
        res.status(201).send({ message: 'User created successfully' })
    } catch (err) {
        next(err)
    }
})

app.post('/login', async (req, res, next) => {
    const { email, password } = req.body || {}
    if (!email || !password) {
        return res.status(400).send({ error: 'Missing credentials' })
    }

    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) return res.status(401).send({ error: 'Invalid credentials' })
        res.status(200).send({ message: 'Login ok', session: data.session })
    } catch (err) {
        next(err)
    }
})

app.post('/logout', async (_, res) => {
    const { error } = await supabase.auth.signOut()
    if (error) {
        return res.status(500).send({ error: 'Could not log out' })
    }
    res.status(200).send({ message: 'Logged out' })
})

// File Routes 
app.get('/files', requireAuth, async (req, res, next) => {
    try {
        const { data, error } = await req.supabase
            .from('files')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) throw error
        res.send(data)
    } catch (err) {
        next(err)
    }
})

app.post('/upload', requireAuth, upload.single('file'), async (req, res, next) => {
    if (!req.file) {
        return res.status(400).send({ error: 'No file uploaded' })
    }

    const fileName = `${Date.now()}-${req.file.originalname}`
    const storagePath = `${req.user.id}/${fileName}`

    try {
        // Save to storage
        const { error: uploadErr } = await req.supabase.storage
            .from('files')
            .upload(storagePath, req.file.buffer, {
                contentType: req.file.mimetype
            })

        if (uploadErr) throw uploadErr

        // Save data to db
        const { error: dbErr } = await req.supabase.from('files').insert({
            name: fileName,
            size: req.file.size,
            type: req.file.mimetype,
            user_id: req.user.id
        })

        if (dbErr) {
            // back offing file if db insert fails
            await req.supabase.storage.from('files').remove([storagePath])
            throw dbErr
        }

        res.status(200).send({ message: 'Upload successful', path: storagePath })
    } catch (err) {
        next(err)
    }
})

app.delete('/files/:id', requireAuth, async (req, res, next) => {
    const fileId = req.params.id
    try {
        const { data: file, error: fetchErr } = await req.supabase
            .from('files')
            .select('name')
            .eq('id', fileId)
            .single()

        if (fetchErr || !file) {
            return res.status(404).send({ error: 'File not found' })
        }

        const { error: dbErr } = await req.supabase.from('files').delete().eq('id', fileId)
        if (dbErr) throw dbErr

        const storageKey = `${req.user.id}/${file.name}`
        const { error: storageErr } = await req.supabase.storage.from('files').remove([storageKey])
        if (storageErr) console.warn('⚠ Storage cleanup failed:', storageKey)

        res.status(200).send({ message: 'File deleted' })
    } catch (err) {
        next(err)
    }
})

// Static frontend 
app.use(express.static('frontend'))

//  Error handler
// (probably want a better logger here, (winston or pino maybe?)
app.use((err, req, res, next) => {
    console.error('--- ERROR ---')
    console.error(err.stack)

    if (err instanceof multer.MulterError || err.message === 'Unsupported file type.') {
        return res.status(400).send({ error: `Upload error: ${err.message}` })
    }

    res.status(500).send({ error: 'Internal server error' })
})

// Server Startup 
app.listen(PORT, () => {
    console.log(formatLogMessage(`Server running on port ${PORT}`))
})