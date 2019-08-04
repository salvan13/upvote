/* eslint-disable no-console */
const Axios = require('axios');
const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
    const code = req.query.code;
    if (!code) {
        const url = new URL('https://github.com/login/oauth/authorize');
        url.searchParams.set('client_id', process.env.GITHUB_ID);
        res.send({ url: url.toJSON() });
        return;
    }
    let resp = await Axios.post('https://github.com/login/oauth/access_token', {
        client_id: process.env.GITHUB_ID,
        client_secret: process.env.GITHUB_SECRET,
        code: code
    }, {
        headers: { Accept: "application/json" }
    });
    if (!resp.data.access_token) {
        console.log(resp.data);
        throw new Error('error_invalid_code');
    }
    const access_token = resp.data.access_token;

    resp = await Axios.get('https://api.github.com/user', {
        headers: { Authorization: `token ${access_token}` }
    });
    if (!resp.data.id) {
        throw new Error('error_invalid_user');
    }

    const jwt_token = jwt.sign({
        id: resp.data.id,
        login: resp.data.login,
        token: access_token
    }, process.env.JWT_SECRET);
    res.send({
        access_token: access_token,
        jwt_token: jwt_token,
        name: resp.data.name,
        login: resp.data.login,
        avatar_url: resp.data.avatar_url,
    });
});

module.exports = router;