const request = require('supertest');
const server = require('../../backend/server');
const { checkEmail, send_mail } = require('../../backend/utils/notificationUtils')

let paymentID;
function payment_suite() {
    test('GET Test Endpoint / with 200, json', async () => {
        let return_obj = { success: true, message: "Hi \ud83d\ude00" }
        const response = await request(server).get('/').send();
        expect(response.statusCode).toBe(200);
        expect(response.headers['content-type']).toBe('application/json');
        expect(response.body.message).toBeDefined()
        expect(response.body).toStrictEqual(return_obj)
    });
    test('POST / with 405, json', async () => {
        let send_obj = {
            "credits_purchased": 100,
            "user_id": 3,
            "currency": "usd"
        }
        let return_obj = { success: false, message: 'Method Not Allowed' }
        const response = await request(server).post('/').send(send_obj);
        expect(response.statusCode).toBe(405);
        expect(response.headers['content-type']).toBe('application/json');
        expect(response.body).toStrictEqual(return_obj)
    });
    test('POST /stripe_auth with 200, json', async () => {
        let send_obj = {
            "credits_purchased": 100,
            "username": "grimm",
            "currency": "usd"
        }
        const response = await request(server).post('/stripe_auth').send(send_obj);
        expect(response.statusCode).toBe(200);
        expect(response.headers['content-type']).toBe('application/json');
        expect(response.body.success).toBeDefined()
        expect(response.body.success).toBe(true)
        expect(response.body.message).toBeDefined() // returns a random ID, impossible to check
        function delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        await delay(2000);
        paymentID = response.body.message.id
        console.log(paymentID)
    });
    test('POST /stripe_auth with 400, Invalid json', async () => {
        let send_obj = {
            "credits_purchased": 100,
            // "user_id": 3, // MISSING USER ID
            "currency": "usd"
        }
        let return_obj = {
            "success": false,
            "message": "Incomplete JSON"
        }
        const response = await request(server).post('/stripe_auth').send(send_obj);
        expect(response.statusCode).toBe(400);
        expect(response.headers['content-type']).toBe('application/json');
        expect(response.body.message).toBeDefined()
        expect(response.body).toStrictEqual(return_obj)
    });
    test('GET /payment endpoint with 200, json', async () => {
        console.log(paymentID)
        let send_obj = {
            "client_id": paymentID,
            "username": "grimm",
            "email": "mg@whatever.com"
        }
        let return_obj = {
            "success": true,
            "message": "Payment has not been initiated or was unsuccessful."
        }
        const response = await request(server).get('/payment').send(send_obj);
        expect(response.statusCode).toBe(200);
        expect(response.headers['content-type']).toBe('application/json');
        expect(response.body.message).toBeDefined()
        expect(response.body).toStrictEqual(return_obj)
    });
    test('GET /payment endpoint with 500 (unknown Stripe ID)', async () => {
        let send_obj = {
            "client_id": "blahblahblah",
            "username": "grimm",
            "email": "mg@whatever.com"
        }
        let return_obj = {
            "success": false,
            "message": "Server error with checking status"
        }
        const response = await request(server).get('/payment').send(send_obj);
        expect(response.statusCode).toBe(500);
        expect(response.headers['content-type']).toBe('application/json');
        expect(response.body.message).toBeDefined()
        expect(response.body).toStrictEqual(return_obj)
    });
    test('POST /payment with 200', async () => {
        let send_obj = {
            "client_id": paymentID,
            "username": "grimm",
            "email": "mg@whatever.com",
            "payment_method": "pm_card_visa"
        }
        const response = await request(server).post('/payment').send(send_obj);
        expect(response.statusCode).toBe(200);
        expect(response.headers['content-type']).toBe('application/json');
        expect(response.body.message).toBeDefined()
        expect(response.body.success).toBeTruthy()
    });
    test('POST /payment with 500, already submitted ID (once per payment session)', async () => {
        let send_obj = {
            "client_id": paymentID,
            "username": "grimm",
            "email": "mg@whatever.com",
            "payment_method": "pm_card_visa"
        }
        let return_obj = {
            "success": false,
            "message": "Error with submitting purchase"
        }
        const response = await request(server).post('/payment').send(send_obj);
        expect(response.statusCode).toBe(500);
        expect(response.headers['content-type']).toBe('application/json');
        expect(response.body.message).toBeDefined()
        expect(response.body).toStrictEqual(return_obj)
    });
}
function email_suite() {
    test('Check Email: Success', async () => {
        let email = "mg@gmail.com"
        let result = await checkEmail(email)
        expect(result).toBeTruthy()
    });
    test('Check Email: No @ symbol', async () => {
        let email = "mggmail.com"
        let result = await checkEmail(email)
        expect(result).toBeFalsy()
    });
    test('Check Email: No .', async () => {
        let email = "mg@gmailcom"
        let result = await checkEmail(email)
        expect(result).toBeFalsy()
    });
    test('Empty Email', async () => {
        let email = ""
        let result = await checkEmail(email)
        expect(result).toBeFalsy()
    });
}

describe('NodeJS Endpoints', () => {
    payment_suite()
    email_suite()
    server.close()
});