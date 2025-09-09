import express from 'express';
import db from './db.js';
import { addWhereVestiges, addWhereDecouvertes, addWhereBiblio, addOrderAliasOnSelectDistinct, cacheMiddleware } from './middleware.js';

const router = express.Router();

// Route handlers
router.get('/', (req, res) => res.render('index.html'));
router.get('/carte', (req, res) => res.render('map.html'));

router.get('/getValues/:tableName', cacheMiddleware, addOrderAliasOnSelectDistinct, async (req, res, next) => {
    // ... (This route is working correctly, no changes needed)
    const { tableName } = req.params;
    let dbquery = res.locals.selectQuery;
    switch (tableName) {
        case 'vestiges': dbquery += ' FROM vestiges JOIN datations ON vestiges.id = datations.id_vestige JOIN caracterisations ON vestiges.id_caracterisation = caracterisations.id JOIN periodes ON datations.id_periode = periodes.id'; break;
        case 'bibliographies': dbquery += ' FROM bibliographies JOIN personnes ON bibliographies.id_auteur1 = personnes.id'; break;
        case 'periodes': dbquery += ' FROM periodes'; break;
        case 'decouvertes': dbquery += ' FROM decouvertes JOIN personnes ON decouvertes.id_inventeur = personnes.id'; break;
        default: return res.status(404).json({ error: 'Table not found' });
    }
    dbquery += res.locals.orderQuery;
    try {
        const values = await db.any(dbquery);
        res.json(values);
    } catch (error) {
        next(error);
    }
});

// Corrected routes with full JOINs and logging
router.get('/sitesFouilles/vestiges', addWhereVestiges, async (req, res, next) => {
    const dbquery = `
        SELECT DISTINCT sf.id FROM sites_fouilles AS sf
        JOIN vestiges AS v ON v.id_site = sf.id
        JOIN datations AS dat ON dat.id_vestige = v.id
        JOIN periodes AS p ON dat.id_periode = p.id
        JOIN caracterisations AS c ON v.id_caracterisation = c.id
        ${res.locals.whereClause}`;
    console.log("Executing SQL for Vestiges:", dbquery.trim());
    try {
        const values = await db.any(dbquery);
        res.json(values);
    } catch (error) {
        next(error);
    }
});

router.get('/sitesFouilles/decouvertes', addWhereDecouvertes, async (req, res, next) => {
    const dbquery = `
        SELECT DISTINCT sf.id FROM sites_fouilles AS sf
        JOIN decouvertes AS d ON sf.id = d.id_site
        JOIN personnes AS p ON d.id_inventeur = p.id
        ${res.locals.whereClause}`;
    console.log("Executing SQL for Decouvertes:", dbquery.trim());
    try {
        const values = await db.any(dbquery);
        res.json(values);
    } catch (error) {
        next(error);
    }
});

router.get('/sitesFouilles/bibliographies', addWhereBiblio, async (req, res, next) => {
    const dbquery = `
        SELECT DISTINCT sf.id FROM sites_fouilles AS sf
        JOIN decouvertes AS d ON sf.id = d.id_site
        JOIN "references_biblio" AS rb ON rb.id_decouverte = d.id
        JOIN bibliographies AS b ON b.id = rb.id_biblio
        JOIN personnes AS p ON p.id = b.id_auteur1
        ${res.locals.whereClause}`;
    console.log("Executing SQL for Bibliographies:", dbquery.trim());
    try {
        const values = await db.any(dbquery);
        res.json(values);
    } catch (error) {
        next(error);
    }
});

export default router;