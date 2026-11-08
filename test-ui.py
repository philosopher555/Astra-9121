import asyncio, json
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        page = await browser.new_page(viewport={"width":1440,"height":900}, device_scale_factor=1)
        errors=[]
        page.on('pageerror', lambda e: errors.append(str(e)))
        await page.goto('http://localhost:4200')
        await page.get_by_text('AI 已连接', exact=True).wait_for(timeout=30000)
        await page.screenshot(path='/home/user/astra-desktop.png', full_page=True)
        await page.get_by_role('button', name='工具箱', exact=False).first.click()
        await page.get_by_role('switch').first.wait_for()
        assert await page.get_by_role('switch').count() == 8
        await page.get_by_role('switch', name='计算器工具', exact=True).click()
        assert await page.get_by_role('switch', name='计算器工具', exact=True).get_attribute('aria-checked') == 'false'
        await page.get_by_role('switch', name='计算器工具', exact=True).click()
        await page.get_by_role('button', name='关闭工具箱', exact=True).click()
        await page.get_by_role('textbox', name='发送消息给 Astra').fill('请调用计算器计算 128*36+2048，简短回答。')
        await page.get_by_role('button', name='发送消息', exact=True).click()
        await page.locator('.message.assistant .markdown').filter(has_text='6656').wait_for(timeout=120000)
        await page.get_by_role('button', name='重新生成', exact=True).wait_for(timeout=30000)
        assert await page.locator('.history-item').count() == 1
        await page.locator('.tool-result summary').click()
        assert '6656' in await page.locator('.tool-result-body').inner_text()
        await page.screenshot(path='/home/user/astra-chat.png', full_page=True)
        await page.reload()
        await page.get_by_text('AI 已连接', exact=True).wait_for()
        await page.locator('.message.assistant .markdown').filter(has_text='6656').wait_for()
        await page.get_by_role('button', name='新建会话', exact=False).click()
        await page.get_by_text('你好，我是 Astra', exact=False).wait_for()
        await page.locator('.history-select').first.click()
        await page.locator('.message.assistant .markdown').filter(has_text='6656').wait_for()
        await page.locator('.history-more').first.click()
        await page.get_by_role('button', name='重命名', exact=True).click()
        await page.get_by_role('textbox', name='会话名称').fill('计算测试')
        await page.get_by_role('button', name='保存', exact=True).click()
        assert '计算测试' in await page.locator('.history-select').inner_text()
        await page.get_by_role('button', name='搜索会话', exact=True).click()
        await page.get_by_role('textbox', name='搜索会话记录').fill('不存在的关键词')
        await page.get_by_text('没有找到相关会话').wait_for()
        await page.get_by_role('button', name='清空搜索').click()
        await page.locator('.history-more').first.click()
        async with page.expect_download() as dl:
            await page.get_by_role('button', name='导出 Markdown', exact=True).click()
        download=await dl.value
        assert download.suggested_filename == '计算测试.md'
        await page.locator('.history-more').first.click()
        await page.get_by_role('button', name='删除会话', exact=True).click()
        await page.get_by_role('button', name='取消', exact=True).click()
        assert await page.locator('.history-item').count() == 1
        mobile=await browser.new_page(viewport={"width":390,"height":844}, device_scale_factor=1)
        await mobile.goto('http://localhost:4200')
        await mobile.get_by_text('AI 已连接', exact=True).wait_for()
        await mobile.screenshot(path='/home/user/astra-mobile.png', full_page=True)
        assert await mobile.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
        await mobile.get_by_role('button', name='展开侧栏', exact=True).click()
        await mobile.get_by_role('button', name='收起侧栏', exact=True).wait_for()
        await mobile.get_by_role('button', name='收起侧栏', exact=True).click()
        print(json.dumps({"errors":errors,"tool_count":8,"chat":"real AI response 6656","history":"persisted reload/new/select/rename/search/export/delete-cancel","mobile":"no horizontal overflow"},ensure_ascii=False))
        assert not errors
        await browser.close()

asyncio.run(main())