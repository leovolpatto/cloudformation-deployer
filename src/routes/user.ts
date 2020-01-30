import express = require('express');
const router = express.Router();

router.get('/', (req: express.Request, res: express.Response) => {
    res.json("users index");
});

router.get('/all', (req: express.Request, res: express.Response) => {
    res.json("all users");
});

router.get('/:id', function (req, res) {
    res.json('user ' + req.params.id);
})

export default router;