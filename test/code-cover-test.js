'use strict';
import chai, { expect } from 'chai';
import request from 'supertest';
import express from 'express';
import requiredToken from '../src/controllers/middleware/required-token';
import { createDB, destroyDB } from './test-helper';
import apiController from '../src/controllers/api-controller';
import config from '../src/config';

// TODO: convert it to async
describe('Middleware', () => {
    before((done) => {
        chai.config.includeStack = true;
        createDB(() => {
            done();
        });
    });

    it('Should get an erro if publicKey property doesnt exists on options passed to middleware', (done) => {
        const app = express();
        app.use(requiredToken({}, apiController.validToken));
        const server = app.listen('5054');
        request(server)
            .post('/api/setup')
            .expect(500)
            .then((res) => {
                expect(res.text).to.be.equal('publicKey is required\n');
                server.close();
                done();
            })
            .catch((err) => {
                server.close();
                done(err);
            });
    });

    it('Should get a message "The API is at...."', (done) => {
        const options = { publicKey: 'token', ignoredRoutes: ['/api'] };
        const app = express();
        app.use(requiredToken(options, apiController.validToken));

        apiController(app, config);

        const server = app.listen('5054');
        request(server)
            .get('/api')
            .expect(200)
            .then((res) => {
                expect(res.text).to.be.equal('The API is at http://url/api');
                server.close();
                done();
            })
            .catch((err) => {
                server.close();
                done(err);
            });
    });

    it('Should get a message "Token is required."', async () => {
        const app = express();
        const options = { publicKey: 'mykey' };
        
        apiController(app, config);

        app.use(requiredToken(options, apiController.validToken));
        const server = app.listen('5054');

        try {
            const res = await request(server)
                .get('/api/users')
                .expect(403);
            await expect(res.body.message).to.be.equal('Token is required.');
            server.close();
        } catch (err) {
            throw err;
        } 
    });

    after(() => {
        destroyDB();
    });
});