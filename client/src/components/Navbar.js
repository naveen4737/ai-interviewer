import React, {useContext} from 'react'
import { Link } from "react-router-dom";

const Navbar = () => {

    return (
        <>
            <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
                <div class="container-fluid">
                    <Link class="navbar-brand" to="/">AI Interviewer</Link>
                </div>
            </nav>
        </>
    )
}

export default Navbar
