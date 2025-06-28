from setuptools import setup, find_packages

setup(
    name="mahjong-template-generator",
    version="1.0.0",
    packages=find_packages(),
    install_requires=[],
    author="Your Name",
    author_email="your.email@example.com",
    description="A tool for generating Mahjong hand templates",
    long_description=open("README.md").read(),
    long_description_content_type="text/markdown",
    url="https://github.com/yourusername/mahjongg-tools",
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires='>=3.8',
    entry_points={
        'console_scripts': [
            'generate-mahjong-templates=generate_templates:main',
        ],
    },
)
