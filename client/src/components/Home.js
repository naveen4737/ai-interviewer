import React from 'react'
import {
    BrowserRouter,
    Routes,
    Route
} from "react-router-dom";
import Navbar from './Navbar'
import Form from './Form'

const Home = () => {
    return (    
        <BrowserRouter>
            <Navbar/>
            <Routes>
                <Route path="/" element={<Form />}> </Route>
                <Route path="/interview" element={<Form />}> </Route>
            </Routes>
        </BrowserRouter>
    )
}

export default Home
