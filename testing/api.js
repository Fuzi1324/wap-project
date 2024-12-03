// api.js
export async function getResponse() {
    try {
    const response = await fetch('http://localhost:3000/api/hello')
    // expecting JSON data { "message": "Hello world!" }
    const data = await response.json();
    return data.message;
    } catch (err) {
    throw new Error('Server Error');
    }
}   