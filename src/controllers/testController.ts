import { Request, Response } from "express";


const testController = {
    async testEndpoint(req: Request, res: Response): Promise<void> { 
        res.status(200).json({
            success: true,
            message: 'test working',
                    error: null,
                    data: null,
                });
                return;
    }
}

export default testController;