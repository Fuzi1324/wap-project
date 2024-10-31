import { useState, useEffect } from "react"

export default function UserPage() {
    const [username, setUsername] = useState('')

    useEffect(() => {
        setUsername(localStorage.getItem('username'))
    }, [])
    
    return (
        <div>
            <h1>UserPage</h1>
            <h3>Hello, {username} </h3>
        </div>
    )
}