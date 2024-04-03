<div id="top"></div>

<!-- NOTES -->
<!--
*** Individual sections below can be removed if not needed
-->

<!-- PROJECT SHIELDS -->
<!--
*** We are using markdown "reference style" links for readability.
*** Reference links are enclosed in brackets [ ] instead of parentheses ( ).
*** See the bottom of this document for the declaration of the reference variables
*** for contributors-url, forks-url, etc. This is an optional, concise syntax you may use.
*** https://www.markdownguide.org/basic-syntax/#reference-style-links
-->
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]
[![LinkedIn][linkedin-shield]][linkedin-url]



<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/optum/react-hooks">
    <img src="images/logo.png" alt="Logo" width="80" height="80">
  </a>

<h3 align="center">react-hooks</h3>

  <p align="center">
    A reusable set of React hooks.
    <br />
    <a href="https://github.com/optum/react-hooks"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://github.com/optum/react-hooks/issues">Report Bug</a>
    ·
    <a href="https://github.com/optum/react-hooks/issues">Request Feature</a>
  </p>
</div>



<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project

This library contains various reusable hooks built and currently being used throughout [Optum](https://optum.com). They were created with the goal of simplifying otherwise complex react procedures and concepts, such as state management of asynchronous data, accessibility, etc. Please feel free to explore this repository and use, contribute, and add to these hooks!

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- GETTING STARTED -->
## Getting Started
Run one of the following commands to add React Hooks to your project: 

**npm**
```shell
npm install @optum/react-hooks
```

or 


**yarn**
```shell
yarn add @optum/react-hooks
```


### Prerequisites
#### Peer dependencies
Please note that [react](www.npmjs.com/package/react) and [react-dom](www.npmjs.com/package/react-dom) are peer dependencies, and should be installed _before_ installing React Hooks

```json
"peerDependencies": {
  "react": "^17.0.0 || ^18.0.0",
  "react-dom": "^17.0.0 || ^18.0.0"
},
```
#### Package Manager
Have desired javascript package mananger installed on your machine:

* [yarn](https://classic.yarnpkg.com/lang/en/docs/install/#mac-stable)
  * preferred but not required

or 
* [npm](https://www.npmjs.com/package/npm)


_**Optional**_
* [yalc](https://github.com/wclr/yalc) 
  * used for testing package locally

<div id='test-locally'>

### Testing Changes Locally
If you are in the process of making changes to this repo and wish to test them, or simply wish to playground with our hooks:

1. Have a working react project
2. Have [yalc](https://github.com/wclr/yalc) installed globally
```sh
yarn global add yalc
```
3. Inside `react-hooks` directory, publish package to yalc store
```sh
yalc publish
```
4. Inside of directory of your project, add package
```sh
yalc add react-hooks
```
5. As you make changes inside of `react-hooks`, continue publishing to store, as explained in step 3.
6. Update yalc store inside of project directory after each new publish (this may require stopping running instances of project)
```sh
yalc update
```
7. Once finished, remove yalc package from project directory
```sh
yalc remove react-hooks
```
or
```sh
yalc remove --all
```
(if you wish to remove other yalc packages)



<p align="right">(<a href="#top">back to top</a>)</p>

<!-- USAGE EXAMPLES -->
## Usage
Please refer to directories inside of `/hooks` for usages of individual hooks. 

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- ROADMAP -->
## Roadmap
<!-- 
- [] Feature 1
- [] Feature 2
- [] Feature 3
    - [] Nested Feature -->
See the [open issues](https://github.com/optum/react-hooks/issues) for a full list of proposed features (and known issues).

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- LICENSE -->
## License

Distributed under the Apache 2.0 License. See `LICENSE.txt` for more information.

<p align="right">(<a href="#top">back to top</a>)</p>



<!-- MAINTAINERS -->
## Maintainers

- Niels Peschel
  - GitHub: [NielsJPeschel](https://github.com/NielsJPeschel)
  - Email: peschel.niels@gmail.com
- Nicholas Thurow
  - GitHub: [nthurow](https://github.com/nthurow)
  <!-- - Email: email2@email.com -->

<p align="right">(<a href="#top">back to top</a>)</p>

<!-- ACKNOWLEDGMENTS -->
<!-- ## Acknowledgments

* []()
* []()
* []()

<p align="right">(<a href="#top">back to top</a>)</p> -->



<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/optum/react-hooks.svg?style=for-the-badge
[contributors-url]: https://github.com/optum/react-hooks/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/optum/react-hooks.svg?style=for-the-badge
[forks-url]: https://github.com/optum/react-hooks/network/members
[stars-shield]: https://img.shields.io/github/stars/optum/react-hooks.svg?style=for-the-badge
[stars-url]: https://github.com/optum/react-hooks/stargazers
[issues-shield]: https://img.shields.io/github/issues/optum/react-hooks.svg?style=for-the-badge
[issues-url]: https://github.com/optum/react-hooks/issues
[license-shield]: https://img.shields.io/github/license/optum/react-hooks.svg?style=for-the-badge
[license-url]: https://github.com/optum/react-hooks/blob/master/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/niels-peschel
[product-screenshot]: images/screenshot.png
