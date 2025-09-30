module.exports = {
    apps: [
        {
            name: "wms-ymid-frontend",
            script: "node_modules/next/dist/bin/next",
            args: "start -p 4800",
            cwd: "D:/Next JS Project/next-app",
            watch: false
        }, {
            name: "wms-ymid-backend",
            cwd: "D:/Golang Project/backend-wms/fiber-app",
            script: "./app.exe",   // hasil build Go jadi exe
            exec_mode: "fork",
            watch: false
        }
    ]
};
