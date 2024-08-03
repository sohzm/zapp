import asyncio
import json
import traceback
from io import StringIO
import sys
import os
from aiohttp import web
import aiohttp
from aiohttp import WSMsgType
from IPython.core.interactiveshell import InteractiveShell
from IPython.core.displayhook import DisplayHook
from IPython.display import display, Markdown

class NotebookDisplayHook(DisplayHook):
    def __init__(self, shell=None):
        super().__init__(shell=shell)
        self.output = []

    def start_displayhook(self):
        self.output = []

    def write_output_prompt(self):
        pass

    def write_format_data(self, format_dict, md_dict=None):
        self.output.append(format_dict)

    def finish_displayhook(self):
        pass

class NotebookServer:
    def __init__(self, port, web_dir):
        self.port = port
        self.web_dir = web_dir
        self.shell = InteractiveShell.instance()
        self.displayhook = NotebookDisplayHook(shell=self.shell)
        self.shell.display_pub.publish = self.capture_display_pub

    def capture_display_pub(self, data, metadata=None):
        self.displayhook.output.append(data)

    async def execute_code(self, code_input):
        old_stdout, old_stderr = sys.stdout, sys.stderr
        redirected_output = StringIO()
        sys.stdout = sys.stderr = redirected_output
        
        try:
            result = self.shell.run_cell(code_input)
            captured_output = redirected_output.getvalue()
            
            # Process rich output
            rich_output = []
            for output in self.displayhook.output:
                if 'text/markdown' in output:
                    rich_output.append({'type': 'markdown', 'content': output['text/markdown']})
                elif 'text/plain' in output:
                    rich_output.append({'type': 'text', 'content': output['text/plain']})
            
            # Clear the output for the next execution
            self.displayhook.output = []
            
            return {
                'success': result.success,
                'stdout': captured_output,
                'rich_output': rich_output,
                'error': result.error_before_exec or result.error_in_exec
            }
        except:
            return {
                'success': False,
                'stdout': '',
                'rich_output': [],
                'error': traceback.format_exc()
            }
        finally:
            sys.stdout, sys.stderr = old_stdout, old_stderr

    async def handle_websocket(self, request):
        ws = web.WebSocketResponse()
        await ws.prepare(request)
        async for msg in ws:
            if msg.type == WSMsgType.TEXT:
                try:
                    data = json.loads(msg.data)
                    code = data.get('code', '')
                    blockId = data.get('blockId', None)
                    output = await self.execute_code(code)
                    await ws.send_json({'output': output, 'blockId': blockId})
                except json.JSONDecodeError:
                    await ws.send_json({'error': 'Invalid JSON'})
            elif msg.type == WSMsgType.ERROR:
                print(f'WebSocket connection closed with exception {ws.exception()}')
        return ws

    async def handle_static(self, request):
        path = request.match_info.get('path', 'index.html')
        file_path = os.path.join(self.web_dir, path)
        if os.path.exists(file_path) and not os.path.isdir(file_path):
            return web.FileResponse(file_path)
        return web.Response(status=404, text='404: Not Found')

    def run(self):
        app = web.Application()
        app.router.add_get('/ws', self.handle_websocket)
        app.router.add_get('/{path:.*}', self.handle_static)
        web.run_app(app, host='localhost', port=self.port)

if __name__ == "__main__":
    port = 8765
    web_dir = 'web'
    notebook_server = NotebookServer(port, web_dir)
    notebook_server.run()
