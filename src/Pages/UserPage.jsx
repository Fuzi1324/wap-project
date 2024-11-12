import { useState, useEffect } from "react"
import Navigation from "../components/Navigation"

export default function UserPage() {
    const [username, setUsername] = useState('')

    useEffect(() => {
        setUsername(localStorage.getItem('username'))
    }, [])
    
    return (
        <div>
            <Navigation />
            <h1>UserPage</h1>
            <h3>Hello, {username} </h3>
        </div>
    )
}