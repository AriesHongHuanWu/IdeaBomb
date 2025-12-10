import React from 'react';
import { motion } from 'framer-motion';

const variants = {
    initial: {
        opacity: 0,
        y: 20,
    },
    animate: {
        opacity: 1,
        y: 0,
    },
    exit: {
        opacity: 0,
        y: -20,
    }
};

const transition = {
    duration: 0.4,
    ease: [0.43, 0.13, 0.23, 0.96] // Standard ease-out
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
