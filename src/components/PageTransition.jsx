import React from 'react';
import { motion } from 'framer-motion';

const variants = {
    initial: {
        opacity: 0,
        scale: 0.98,
        y: 15,
        filter: 'blur(8px)'
    },
    animate: {
        opacity: 1,
        scale: 1,
        y: 0,
        filter: 'blur(0px)'
    },
    exit: {
        opacity: 0,
        scale: 1.02,
        y: -15,
        filter: 'blur(8px)'
    }
};

const transition = {
    type: "spring",
    stiffness: 400,
    damping: 30,
    mass: 1
};

const PageTransition = ({ children }) => {
    return (
        <motion.div
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
            style={{ width: '100%', height: '100%', position: 'relative' }}
        >
            {children}
        </motion.div>
    );
};

export default PageTransition;
