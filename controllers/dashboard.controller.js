

export const getDashboardStats = async(req, res)=>{
    try{

    }catch(e){
        return res.status(500).json({
            success:false,
            message:"failed to get dashboard stats"
        })
    }
}