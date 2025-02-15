const getRecordType = (save_type)=>{
    let record_type = 1;
    switch(save_type){
        case "template":
            record_type = 2 // template
        break;
    }
    return record_type
}

const parseJwtExpiry = (expiryString) => {
    const match = expiryString.match(/^(\d+)([hmd])$/); // Match number + unit
    if (!match) return null;

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
        case 'h': return value * 60 * 60; // Convert hours to seconds
        case 'm': return value * 60; // Convert minutes to seconds
        case 'd': return value * 24 * 60 * 60; // Convert days to seconds
        default: return null;
    }
};


export {
    getRecordType,
    parseJwtExpiry
}