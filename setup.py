from setuptools import setup, find_packages

setup(
    name="docipy",
    version="1.1.0",
    packages=find_packages(),
    install_requires=[
        "datetime",
        "markdown",
        "colored",
    ],
    entry_points={
        "console_scripts": [
            "docipy=docipy.main:main",  # Entry point of the app
        ],
    },
    package_data={
        "docipy": [
            "author.png",
            "bootstrap-icons.woff",
            "bootstrap-icons.woff2",
            "bootstrap.icons.css",
            "docipy.js",
            "docipy.scss",
            "highlight.js",
            "logo.ico",
            "robots.txt",
            "sitemap.xml",
            "template.html",
            "lng/ge.yaml",
            "lng/ru.yaml",
        ],
    },
    include_package_data=True,
    author="Irakli Gzirishvili",
    author_email="gziraklirex@gmail.com",
    description="DociPy is a Python command-line interface (CLI) application designed to easily generate impressive static HTML documentation",
    long_description=open("README.md").read(),
    long_description_content_type="text/markdown",
    url="https://github.com/IG-onGit/DociPy",
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
)
