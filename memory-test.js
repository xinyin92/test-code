/**
 *
 * 建议配合chrome dev tool 的memory工具使用
 * 在执行runClickTest前，点击强制垃圾回收，并通过Heap Snapshot拍一张堆快照
 * 执行runClickTest，查看log的内存增长情况
 * 执行结束后，点击强制垃圾回收，再拍一张堆快照
 * 比较两次快照的内存差异，定位内存泄漏的原因
 */

/**
 *
 * @param {Array} targetList 来回点击的a标签
 * @param {Number} loopTimes 多少个循环，从a到b再回到a是一个循环
 * @param {Number} clickInterval 点击的间隔，一般不能太小，太小可能会出现内存没有及时自动回收导致页面内存溢出的情况，经测试30s是一个比较合适的时间间隔
 */

function runClickTest(targetList, loopTimes, clickInterval) {
    var startPos = 0;
    var endPos = targetList.length - 1;

    var memoryList = []; // 所有页面来回跳转的记录
    targetList[0].click(); // 定位到测试最开始的页面

    clickInterval = clickInterval || 30; // 间隔，单位为秒
    loopTimes = loopTimes*2 || 30; // 必须是偶数，最后才能回到开始的页面

    var getMemory = () => {
        let performance = window.performance;
        return  performance.memory.totalJSHeapSize;
    }
    var memoryClickTest = function(testTargetPos) {

        var testDom = testTargetPos.map(pos => targetList[pos]);
        var startMem = getMemory(); // 初始内存
        var endMem = null; // 结束内存

        var memoryMap = {
            formPage: testDom[0].hash,
            toPage: testDom[1].hash
        }; // 两个页面之间来回跳转的记录

        var curMem = startMem;
        memoryMap.startMem = startMem;

        var prevMem = null;
        var endMem = null;

        var index = 1; // 点击次数count，从1开始
        console.log(`---- test memory from page: '${testDom[0].hash}' to page: '${testDom[1].hash}' ----`);
        var tid = window.setInterval(() => {
            if (index > loopTimes) {
                window.clearInterval(tid);
                endMem = getMemory();
                memoryMap.endMem = endMem;
                memoryMap.totalIncreaseMem = memoryMap.endMem - memoryMap.startMem;

                console.log(`---- end page: '${location.hash}', end memory: ${endMem}`);
                console.log(`---- memory detail: ` + JSON.stringify(memoryMap, null, '\t'));
                console.log(`-------------------`);
                memoryList.push(memoryMap);

                // 判断是不是所有dom的判断好了
                if (startPos < endPos - 1) {
                    startPos++;
                    testDom[1].click();
                    memoryClickTest([startPos, startPos+1]);

                // 需要比较列表最后一个页面到第一个页面的内存增长情况时解开该段注释
                // } else if (startPos === endPos - 1) {
                //     startPos++;
                //     testDom[1].click();
                //     memoryClickTest([startPos, 0]);
                } else {
                    const allString = JSON.stringify(memoryList, null, '\t');
                    console.log(`------ all memory detail: ` + allString);
                    createAndDownloadFile('memory-test-result' + Date.now() + '.txt', allString);
                }
                return;
            };

            prevMem = curMem;
            curMem = getMemory();


            console.log(`current page: '${location.hash}'`);
            console.log(`current memory info -- prevMem: ${prevMem}, curMem: ${curMem}, increaseMem: ${curMem - prevMem}`);
            console.log(`-- click ${index} --`)
            // 记录每一次跳转的内存情况
            memoryMap[index] = {
                prevMem: prevMem,
                curMem: curMem,
                increaseMem: curMem - prevMem
            };

            // 来回点击
            testDom[index++%2].click();

        }, clickInterval*1000);
    }

    memoryClickTest([0, 1]); // 从0跳转到1，重复多次最后跳回0，比较内存增长情况
}
/**
 * 创建并下载文件
 * @param  {String} fileName 文件名
 * @param  {String} content  文件内容
 */
function createAndDownloadFile(fileName, content) {
    var aTag = document.createElement('a');
    var blob = new Blob([content]);
    aTag.download = fileName;
    aTag.href = URL.createObjectURL(blob);
    aTag.click();
    URL.revokeObjectURL(blob);
}