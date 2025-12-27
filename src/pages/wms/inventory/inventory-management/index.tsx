import Layout from "@/components/layout"
import QAStatusManagement from "@/components/qastatus-management"

export default function Home() {
    return (
        <Layout title="Inventory Management - WMS" subTitle="Inventory Management">
            <div className="max-w-7xl mx-auto p-4">
                <QAStatusManagement />
            </div>
        </Layout>
    )
}
