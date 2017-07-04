---
layout: post
title: “241 years of Independence” in 3 Languages
---
Since this is the 241<sup>st</sup> anniversary of the United States’ founding, let me present to you “241 years of Independence” in C, C++, and Python:

```
#ifdef __cplusplus
#include <iostream>
#define print(x) int main() { std::cout << x << std::endl; return 0; }
#else
#include <stdio.h>
#define print(x) int main() { puts(x); return 0; }
#endif
print("241 years of Independence")
```