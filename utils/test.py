
order_list = []
for c in Q2.cols :
  if not c.r99 :
    order_list.append(Q2.rows[c.val].index)

order_list += [r.index for r in Q2.rows if not r.index in order_list and not r.value in [99]]
