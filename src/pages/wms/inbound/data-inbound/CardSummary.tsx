import { ArrowDown, CheckSquare, ListOrdered } from "lucide-react";

const CardSummary = () => {
    return (
        <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-600 text-sm font-medium">
                                Total Transaction
                            </p>
                            <p className="text-2xl font-bold text-slate-800 mt-2">
                                {/* {filteredStock.totalQtyIn.toLocaleString()} */}
                                100
                            </p>
                        </div>
                        <div className="p-3 bg-slate-100 rounded-lg">
                            <ListOrdered className="text-slate-600" size={24} />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-600 text-sm font-medium">
                                Total Qty Planning
                            </p>
                            <p className="text-2xl font-bold text-slate-800 mt-2">
                                {/* {filteredStock.totalQtyIn.toLocaleString()} */}
                                100
                            </p>
                        </div>
                        <div className="p-3 bg-slate-100 rounded-lg">
                            <ArrowDown className="text-slate-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-600 text-sm font-medium">
                                Total Qty Putaway
                            </p>
                            <p className="text-2xl font-bold text-slate-800 mt-2">
                                {/* {filteredStock.totalQtyOnHand.toLocaleString()} */}
                                80
                            </p>
                        </div>
                        <div className="p-3 bg-slate-100 rounded-lg">
                            <CheckSquare className="text-slate-600" size={24} />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default CardSummary;