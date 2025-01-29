import os
import re
import sys
import time
import json
import yaml
import string
import random
import shutil
import datetime
import markdown
import webbrowser
from colored import fg, bg, attr


class DociPy:
    ####################################################################################// Load
    def __init__(self, args=[]):
        self.__annotations()
        args.pop(0)
        self.doc = os.getcwd()
        self.app = os.path.dirname(os.path.realpath(__file__))
        self.args = args
        self.menus = ""
        self.blocks = ""
        self.blockers = []
        self.template = open(f"{self.app}/template.html", "r").read()

        exists = os.path.exists(f"{self.doc}/__storage__/docipy.json")
        self.params = self.__config()
        self.menu = self.__menu()

        if len(args) > 0 and args[0] == "config":
            return self.config(exists)

        self.render()
        pass

    ####################################################################################// Main
    def render(self):
        self.__copyFiles(self.params)

        file = f"{self.doc}/index.html"
        if not os.path.exists(file):
            return False

        self.__render(self.menu)
        self.params["menus"] = self.menus
        self.params["blocks"] = self.blocks
        parsed = self.__parseTemplate(self.template, self.params)

        open(file, "w", encoding="utf-8").write(parsed)
        print(fg("green") + " Documentation rendered successfully" + attr("reset"))
        print(fg("green") + " Please wait ..." + attr("reset"))

        time.sleep(2)
        webbrowser.open(file)
        pass

    def config(self, exists=True):
        if not exists:
            return False

        self.params = self.__config(True)
        print(fg("green") + " Configuration updated successfully" + attr("reset"))
        self.render()
        pass

    ####################################################################################// Helpers
    def __config(self, rewrite=False):
        file = f"{self.doc}/__storage__/docipy.json"
        if not rewrite and os.path.exists(file):
            content = open(file, "r").read()
            return json.loads(content)

        data = {
            "date": datetime.datetime.now().strftime("%Y-%m-%d"),
            "docipy-hint": "Build Docs With DociPy",
            "docipy-page": "#",
        }

        params = self.__params()
        for param in params:
            parts = params[param].split("|")
            hint = parts[0].strip()
            default = ""
            must = False
            if "!" in param:
                must = True
                param = param.replace("!", "")
            if len(parts) > 1:
                default = parts[1].strip()
            data[param] = self.__input(rewrite, param, hint, must, default)
        print()

        os.makedirs(os.path.dirname(file), exist_ok=True)
        open(file, "w").write(json.dumps(data))

        return data

    def __copyFiles(self, params={}):
        items = self.__copy()
        for item in items:
            path = f"{self.app}/{item}"
            new = f"{self.doc}/{items[item]}"

            if item[0] == "!":
                path = f"{self.app}/{item[1:]}"
            elif os.path.exists(new):
                continue
            else:
                shutil.copy(path, new)
                continue

            content = open(path, "r", encoding="utf-8", errors="replace").read()
            parsed = self.__parseTemplate(content, params)
            open(new, "w", encoding="utf-8").write(parsed)

    def __input(self, rewrite=False, key="", hint="", must=False, default=""):
        if rewrite:
            value = input(fg("yellow") + f" {hint}: " + attr("reset"))
            if not value:
                value = self.params[key]
            return value

        value = ""
        while not value:
            value = input(fg("yellow") + f" {hint}: " + attr("reset"))
            if not must:
                if not value:
                    return default
                return value
        return value

    def __menu(self):
        file = f"{self.doc}/menu.yaml"
        if os.path.exists(file):
            content = open(file, "r").read()
            filtered = self.__filterYaml(content)
            return yaml.safe_load(filtered)

        content = (
            self.__yamlDir(self.doc)
            .replace("\n\n", "\n")
            .replace("\n\n\n", "\n\n")
            .replace("- $circle ", "- ")
        )
        open(file, "w").write(content.replace("$", "*"))

        filtered = self.__filterYaml(content)
        return yaml.safe_load(filtered)

    def __filterYaml(self, content):
        filtered = content.replace("*", "$") + "\n"
        for item in re.findall(r"\$(.*?)\n", filtered):
            if not item.strip()[-1] == ":":
                filtered = filtered.replace(f"${item}\n", f"${item}:\n")
                parts = item.split(" ")
                parts.pop(0)
                ref = " ".join(parts).replace(" ", "_").lower()
                self.blockers.append(ref)

        return filtered

    def __yamlDir(self, dir_path):
        def scan(dir_path):
            result = {}
            for item in os.listdir(dir_path):
                item = item.replace(".md", "").strip()
                if item in [
                    "__storage__",
                    ".git",
                    ".gitignore",
                    "index.html",
                    "robots.txt",
                ]:
                    continue
                item_path = os.path.join(dir_path, item)
                if os.path.isdir(item_path):
                    result[item] = scan(item_path)
                else:
                    if None not in result:
                        result[None] = []
                    result[None].append(item)
            return result

        directory_content = scan(dir_path)

        def dict_to_yaml_format(d, indent_level=0):
            yaml_output = []
            indent = "  " * indent_level
            for key, value in d.items():
                if key is None:
                    for item in value:
                        if indent_level == 0:
                            yaml_output.append(f"$caret-right {item}")
                        else:
                            yaml_output.append(f"{indent}- {item}")
                        yaml_output.append("")
                else:
                    if indent_level == 0:
                        yaml_output.append(f"{indent}- $caret-right {key}:")
                    else:
                        yaml_output.append(f"{indent}- {key}:")
                    if isinstance(value, dict):
                        yaml_output.append(dict_to_yaml_format(value, indent_level + 1))
                        yaml_output.append("")
                    else:
                        for item in value:
                            yaml_output.append(f"{indent}  - {item}")
            return "\n".join(yaml_output)

        yaml_content = dict_to_yaml_format(directory_content)
        final = "\n".join(
            [
                line[2:] if line[:2] == "- " else line
                for line in yaml_content.splitlines()
            ]
        )

        return final

    def __parseTemplate(self, content="", params={}):
        for param in params:
            content = content.replace("{{" + param + "}}", params[param])
        return content

    def __rand(self, length=10):
        return "".join(random.choices(string.ascii_letters, k=length)).lower()

    def __parseMarkdown(self, path=""):
        path = os.path.join(self.doc, path)
        if not os.path.exists(path):
            return "..."

        content = open(path, "r", encoding="utf-8", errors="replace").read()
        return markdown.markdown(content, extensions=["fenced_code"])

    def __render(self, items={}, parent="", folder=""):
        if not items:
            return False

        for item in items:
            if isinstance(item, dict):
                self.__render(item, parent, folder)
                continue
            parts = item.split(" ")
            icon = "bi bi-" + parts[0].replace("$", "").strip()
            parts.pop(0)
            label = " ".join(parts).strip()
            if "$" not in item:
                label = item
                icon = ""
            ref = label.replace(" ", "_").lower()  # ENG
            # ref = "a" + self.__rand()
            hint = f"{parent}-{ref}"
            hfolder = f"{folder}/{label}"
            if hfolder[0] == "/":
                hfolder = hfolder[1:]
            blocked = True
            for blocker in self.blockers:
                if f"{blocker}-" in hint:
                    blocked = False

            multi = (
                item in items
                and isinstance(items, dict)
                and isinstance(items[item], list)
                and len(items[item]) > 0
            )
            chevron = ""
            if multi:
                chevron = '<i class="bi bi-chevron-down"></i>'
            if hint[0] == "-":
                hint = hint[1:]
            if multi:
                self.menus += (
                    f'<p ref="{hint}" class="{hint} {icon}">{label}{chevron}</p>'
                )
                self.menus += f'<ul class="{hint}-docipymenu hide">'
                # if blocked:
                #     self.blockers.append(ref)
                self.blocks += f'<div class="docipygroup {hint}-docipyblock hide">'
                self.__render(items[item], hint, hfolder)
                # if blocked:
                self.blocks += "</div>"
                self.menus += "</ul>"
            else:
                content = self.__parseMarkdown(f"{hfolder}.md")
                if hint in self.blockers:
                    self.blocks += f'<div class="docipygroup {hint}-docipyblock hide"><section id="{hint}">{content}</section></div>'
                else:
                    self.blocks += f'<section id="{hint}">{content}</section>'
                self.menus += (
                    f'<a href="#{hint}" class="{hint} {icon}">{label}{chevron}</a>'
                )
        pass

    def __annotations(self):
        hint = (
            "",
            "-----------------------------------------------------------------------------",
            "",
            "Project: DociPy - v1.0",
            "Author: Irakli Gzirishvili",
            "Email: gziraklirex@gmail.com",
            "",
            "-----------------------------------------------------------------------------",
            "",
        )

        print("\n".join(hint))
        pass

    def __params(self):
        return {
            "!project": "Project",
            "!version": "Version",
            "slogan": "Slogan | ...",
            "description": "Description | ...",
            "keywords": "Keywords",
            "doc-url": "Documentation URL | .",
            "!author": "Author",
            "position": "Position | ...",
            "!email": "Email",
            "linkedin": "LinkedIn | #",
            "x": "X | #",
            "button1-name": "Button 1 Name | Explore",
            "button1-link": "Button 1 Link | #docipy",
            "button2-name": "Button 2 Name | Download",
            "button2-link": "Button 2 Link | #",
            "main-color": "Main Color | #604384",
            "main-dark": "Dark Color | #222222",
            "googletag-script": "Google Tag (script)",
            "copyrighted-meta": "Copyrighted Verification (meta)",
            "copyrighted-badge": "Copyrighted Badge (a, script)",
            # "": "",
        }

    def __copy(self):
        return {
            "author.png": "__storage__/author.png",
            "bootstrap-icons.woff": "__storage__/bootstrap-icons.woff",
            "bootstrap-icons.woff2": "__storage__/bootstrap-icons.woff2",
            "bootstrap.icons.css": "__storage__/bootstrap.icons.css",
            "docipy.js": "__storage__/docipy.js",
            "!docipy.scss": "__storage__/docipy.css",
            "highlight.js": "__storage__/highlight.js",
            "logo.ico": "__storage__/logo.ico",
            "!sitemap.xml": "__storage__/sitemap.xml",
            "template.html": "index.html",
            "!robots.txt": "robots.txt",
            # "": "",
        }


DociPy(sys.argv)
