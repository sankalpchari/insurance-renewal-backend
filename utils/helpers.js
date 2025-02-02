const getRecordType = (save_type)=>{
    let record_type = 1;
    switch(save_type){
        case "template":
            record_type = 2 // template
        break;
    }
    return record_type
}


export {
    getRecordType
}